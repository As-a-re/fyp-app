import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { messageAPI } from "../services/api";

// Plays a voice-note message inline. A tiny standalone component (rather
// than inlined in MessageBubble) so each bubble owns its own player
// instance/state - expo-audio's useAudioPlayer hook must be called at a
// stable position, so this can't live inside a conditional branch of
// MessageBubble itself.
const AudioMessagePlayer = ({ uri, tint }) => {
  const player = useAudioPlayer(uri ? { uri } : null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!uri) return;
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.seekTo(0);
      player.play();
      setPlaying(true);
    }
  };

  return (
    <TouchableOpacity onPress={toggle} style={styles.audioMessageRow} disabled={!uri}>
      <MaterialCommunityIcons
        name={playing ? "pause-circle" : "play-circle"}
        size={32}
        color={tint}
      />
      <Text style={[styles.audioMessageLabel, { color: tint }]}>
        {uri ? "Voice message" : "Voice message (unavailable)"}
      </Text>
    </TouchableOpacity>
  );
};

const MessageBubble = ({ message, colors, isSender, currentUserId }) => {
  const isCurrentUserSender = message.sender_id === currentUserId;
  const bubbleTextColor = isCurrentUserSender ? "#fff" : colors.text;

  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isCurrentUserSender
          ? styles.sentBubbleContainer
          : styles.receivedBubbleContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isCurrentUserSender
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.card },
        ]}
      >
        {message.message_type === "audio" ? (
          <AudioMessagePlayer uri={message.media_signed_url} tint={bubbleTextColor} />
        ) : message.message_type === "video" ? (
          <View style={styles.videoMessageRow}>
            <MaterialCommunityIcons name="video" size={28} color={bubbleTextColor} />
            <Text style={[styles.audioMessageLabel, { color: bubbleTextColor }]}>
              {message.media_signed_url ? "Video message" : "Video message (unavailable)"}
            </Text>
            {message.media_signed_url && (
              <TouchableOpacity
                onPress={() => Linking.openURL(message.media_signed_url)}
                style={styles.videoOpenButton}
              >
                <MaterialCommunityIcons name="play" size={18} color={bubbleTextColor} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.messageText, { color: bubbleTextColor }]}>
            {message.message}
          </Text>
        )}
        <Text
          style={[
            styles.messageTime,
            {
              color: isCurrentUserSender
                ? "rgba(255,255,255,0.7)"
                : colors.textSecondary,
            },
          ]}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
};

export default function ChatDoctorScreen() {
  const router = useRouter();
  const { doctorId, doctorName } = useLocalSearchParams();
  const { user } = useAuth();
  const colors = Colors.light;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recording, setRecording] = useState(false);
  const flatListRef = useRef(null);

  // Native (iOS/Android) voice-note recorder - same expo-audio pattern
  // already proven working in components/TwiAIComponent.js.
  const nativeRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const nativeRecorderState = useAudioRecorderState(nativeRecorder);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (doctorId) {
      loadMessages();
      // Set up auto-refresh
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [doctorId]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getConversation(doctorId, {
        limit: 100,
      });
      setMessages(response.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      if (!loading) {
        // Only show alert if already loaded (not on initial load)
        Alert.alert("Error", "Failed to load messages");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setSending(true);
    const messageToSend = inputText.trim();
    setInputText("");

    try {
      await messageAPI.sendMessage({
        recipient_id: doctorId,
        message: messageToSend,
        message_type: "text",
      });

      // Reload messages to show the sent message
      await loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      setInputText(messageToSend);
      Alert.alert(
        "Error",
        error.message || "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
  };

  // --- Voice note recording ---
  // Web: browser MediaRecorder. Native: expo-audio. Both land on
  // submitMediaMessage, mirroring the pattern in components/TwiAIComponent.js.
  const submitMediaMessage = async (mediaSource, filenameHint) => {
    setSending(true);
    try {
      await messageAPI.sendMediaMessage(doctorId, mediaSource, {
        filename: filenameHint,
      });
      await loadMessages();
    } catch (error) {
      console.error("Error sending media message:", error);
      Alert.alert("Error", error.message || "Failed to send voice message.");
    } finally {
      setSending(false);
    }
  };

  const startWebRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        await submitMediaMessage(blob, "voice.webm");
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      Alert.alert("Error", "Could not access the microphone.");
    }
  };

  const stopWebRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const startNativeRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Please allow microphone access to send voice messages.",
        );
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await nativeRecorder.prepareToRecordAsync();
      nativeRecorder.record();
      setRecording(true);
    } catch (error) {
      console.error("Failed to start native recording:", error);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopNativeRecording = async () => {
    try {
      await nativeRecorder.stop();
      setRecording(false);

      const uri = nativeRecorder.uri;
      if (!uri) return;

      await submitMediaMessage({ uri, name: "voice.m4a", type: "audio/m4a" });
    } catch (error) {
      console.error("Failed to stop native recording:", error);
      Alert.alert("Error", "Could not process the recording.");
      setRecording(false);
    }
  };

  const isRecording = Platform.OS === "web" ? recording : recording || nativeRecorderState.isRecording;
  const startRecording = () => (Platform.OS === "web" ? startWebRecording() : startNativeRecording());
  const stopRecording = () => (Platform.OS === "web" ? stopWebRecording() : stopNativeRecording());

  // --- Video message ---
  // Records via the native camera UI (expo-image-picker) rather than a
  // custom camera view - much less to build/get wrong, and the picker
  // already handles permissions and a proper recording UI itself.
  const handleRecordVideo = async () => {
    try {
      const ImagePicker = require("expo-image-picker");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera permission needed", "Please allow camera access to send video messages.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60,
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (Platform.OS === "web") {
        // On web, expo-image-picker returns a data: URI - convert to a Blob.
        const blob = await fetch(asset.uri).then((r) => r.blob());
        await submitMediaMessage(blob, "video.mp4");
      } else {
        await submitMediaMessage({
          uri: asset.uri,
          name: "video.mp4",
          type: asset.mimeType || "video/mp4",
        });
      }
    } catch (error) {
      console.error("Video capture error:", error);
      Alert.alert("Error", "Could not record video.");
    }
  };

  const handleStartVoiceCall = () => {
    router.push({
      pathname: "/video-call",
      params: {
        doctorId,
        doctorName,
        callType: "audio",
      },
    });
  };

  const handleStartVideoCall = () => {
    router.push({
      pathname: "/video-call",
      params: {
        doctorId,
        doctorName,
        callType: "video",
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {doctorName || "Doctor"}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Online
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {doctorName || "Doctor"}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Online
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleStartVoiceCall}
              style={styles.callButton}
            >
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStartVideoCall}
              style={styles.callButton}
            >
              <MaterialCommunityIcons
                name="video"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={colors.textSecondary}
                style={{ opacity: refreshing ? 0.5 : 1 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                colors={colors}
                currentUserId={user?.id}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onEndReachedThreshold={0.1}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              messages.length > 0 && (
                <View style={styles.dateHeader}>
                  <Text
                    style={[
                      styles.dateHeaderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Start of conversation
                  </Text>
                </View>
              )
            }
          />
        ) : (
          <View style={styles.emptyMessagesContainer}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No messages yet
            </Text>
            <Text
              style={[styles.emptySubText, { color: colors.textSecondary }]}
            >
              Start a conversation with this doctor
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          {!inputText.trim() && (
            <>
              <TouchableOpacity
                onPress={handleRecordVideo}
                disabled={sending || isRecording}
                style={styles.mediaButton}
              >
                <MaterialCommunityIcons name="video-plus" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                disabled={sending}
                style={[styles.mediaButton, isRecording && styles.mediaButtonActive]}
              >
                <MaterialCommunityIcons
                  name={isRecording ? "stop" : "microphone"}
                  size={24}
                  color={isRecording ? "#fff" : colors.primary}
                />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={sending || !inputText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.primary,
                opacity: sending || !inputText.trim() ? 0.6 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  callButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageBubbleContainer: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  sentBubbleContainer: {
    alignItems: "flex-end",
  },
  receivedBubbleContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: "85%",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  dateHeader: {
    alignItems: "center",
    paddingVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyMessagesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  mediaButtonActive: {
    backgroundColor: "#ef4444",
  },
  audioMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    minWidth: 160,
  },
  videoMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    minWidth: 160,
  },
  audioMessageLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  videoOpenButton: {
    marginLeft: "auto",
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
