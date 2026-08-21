import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
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

const MessageBubble = ({ message, colors, isSender, currentUserId }) => {
  const isCurrentUserSender = message.sender_id === currentUserId;

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
        <Text
          style={[
            styles.messageText,
            { color: isCurrentUserSender ? "#fff" : colors.text },
          ]}
        >
          {message.message}
        </Text>
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

  useEffect(() => {
    if (doctorId) {
      loadMessages();
      // Set up auto-refresh
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [doctorId]);

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
            data={[...messages].reverse()}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
