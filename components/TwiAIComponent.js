import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { twiAPI } from "../services/api";
import TwiAvatarView from "./TwiAvatarView";

// Height reserved above the screen's bottom edge so this screen's own text
// input isn't hidden behind BottomNav (components/BottomNav.js), which is
// rendered as an absolutely-positioned overlay by app/ai-assistant.js and
// sits on top of whichever assistant is showing.
const BOTTOM_NAV_RESERVED_SPACE = 80;

/**
 * Twi conversation path: free knowledge-base (TF-IDF + Groq) -> Twi translation ->
 * humanizing -> GhanaNLP TTS -> TalkingHead 3D avatar. This never touches
 * Tavus. Users can type or mix Twi/English freely; the backend detects the
 * mix per message (see mixedLanguageDetector.js) and always replies in Twi.
 */
export default function TwiAIAssistant() {
  const WELCOME_TEXT =
    "Akwaaba! Wobɛtumi abisa me nsɛm a ɛfa wo mumu anaa wo ba no ho. Kyerɛw wo asɛm, anaa fa English/Twi mfrafra.";

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: WELCOME_TEXT,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [recording, setRecording] = useState(false);

  const avatarRef = useRef(null);
  const pendingSpeechRef = useRef([]);
  const listRef = useRef(null);
  const isFirstTurnRef = useRef(true);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  // Native (iOS/Android) recorder — expo-audio. Harmless to initialize on
  // web too (the library supports web), but the web recording path below
  // uses the browser's MediaRecorder directly since that was already tested
  // and working before native support was added.
  const nativeRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const nativeRecorderState = useAudioRecorderState(nativeRecorder);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
  }, []);

  const speakReply = useCallback((result) => {
    if (!result?.audio_base64) return;
    const payload = {
      audioBase64: result.audio_base64,
      mime: result.audio_mime || "audio/wav",
      text: result.reply_text || "",
      words: result.lipsync?.words || [],
      wtimes: result.lipsync?.wtimes || [],
      wdurations: result.lipsync?.wdurations || [],
    };
    if (!avatarReady || !avatarRef.current) {
      pendingSpeechRef.current.push(payload);
      return;
    }
    avatarRef.current.speak(payload);
  }, [avatarReady]);

  useEffect(() => {
    if (!avatarReady || !avatarRef.current || pendingSpeechRef.current.length === 0) return;
    const queue = pendingSpeechRef.current.splice(0);
    queue.forEach((payload) => avatarRef.current?.speak(payload));
  }, [avatarReady]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
    scrollToEnd();
  }, [scrollToEnd]);

  const handleAssistantResult = useCallback(
    (result) => {
      appendMessage({
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: result.reply_text,
        detectedLanguage: result.detected_language,
        isEmergency: result.is_emergency,
      });
      speakReply(result);
      isFirstTurnRef.current = false;
    },
    [appendMessage, speakReply],
  );

  const sendText = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    appendMessage({ id: `${Date.now()}-user`, role: "user", text });
    setSending(true);

    try {
      const result = await twiAPI.sendMessage({
        text,
        is_first_turn: isFirstTurnRef.current,
      });
      handleAssistantResult(result);
    } catch (error) {
      console.error("Twi message error:", error);
      Alert.alert("Error", error.message || "Failed to reach the assistant");
    } finally {
      setSending(false);
    }
  };

  // --- Voice input ---
  // Web: MediaRecorder captures a webm blob and posts it to /api/twi/voice.
  // Native (iOS/Android): expo-audio records to a local file, which is sent
  // as a multipart file part to the same endpoint. Both paths land on
  // twiAPI.sendVoice and handleAssistantResult, so the rest of the pipeline
  // (transcription, KB lookup, Twi reply, TTS, avatar lip-sync) is identical.
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
        await submitVoiceMessage(blob);
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
          "Please allow microphone access to use voice input.",
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

      await submitVoiceMessage({ uri, name: "voice.m4a", type: "audio/m4a" });
    } catch (error) {
      console.error("Failed to stop native recording:", error);
      Alert.alert("Error", "Could not process the recording.");
      setRecording(false);
    }
  };

  const submitVoiceMessage = async (audioSource) => {
    setSending(true);
    try {
      const result = await twiAPI.sendVoice(audioSource, {
        is_first_turn: isFirstTurnRef.current,
      });
      appendMessage({ id: `${Date.now()}-user`, role: "user", text: result.transcript });
      handleAssistantResult(result);
    } catch (error) {
      console.error("Twi voice error:", error);
      Alert.alert("Error", error.message || "Failed to process voice message");
    } finally {
      setSending(false);
    }
  };

  const startRecording = () => (Platform.OS === "web" ? startWebRecording() : startNativeRecording());
  const stopRecording = () => (Platform.OS === "web" ? stopWebRecording() : stopNativeRecording());

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const isRecording = Platform.OS === "web" ? recording : recording || nativeRecorderState.isRecording;

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
        item.isEmergency && styles.bubbleEmergency,
      ]}
    >
      <Text style={item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
        {item.text}
      </Text>
    </View>
  );

  const greetedRef = useRef(false);

  const speakGreeting = useCallback(async () => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    try {
      const result = await twiAPI.speak(WELCOME_TEXT);
      speakReply(result);
    } catch (error) {
      // Non-fatal: the greeting is a nice-to-have, text is already shown.
      console.error("Failed to speak welcome greeting:", error.message);
    }
  }, [speakReply]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Twi AI Assistant</Text>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: avatarReady ? "#34C759" : "#FF9500" },
            ]}
          />
          <Text style={styles.statusText}>
            {avatarError ? "Avatar error" : avatarReady ? "Ready" : "Loading avatar…"}
          </Text>
        </View>
      </View>

      {avatarError && (
        <View style={styles.avatarErrorBanner}>
          <Text style={styles.avatarErrorText} numberOfLines={2}>
            {avatarError}
          </Text>
          <Text style={styles.avatarErrorHint}>
            You can still chat by text below — this only affects the visual avatar.
          </Text>
        </View>
      )}

      <View style={styles.avatarWrap}>
        <TwiAvatarView
          ref={avatarRef}
          onReady={() => {
            setAvatarReady(true);
            setAvatarError(null);
            speakGreeting();
          }}
          onSpeakingStart={() => setAvatarSpeaking(true)}
          onSpeakingEnd={() => setAvatarSpeaking(false)}
          onError={(message) => setAvatarError(message)}
        />
        {avatarSpeaking && (
          <View style={styles.speakingIndicator}>
            <MaterialCommunityIcons name="waveform" size={16} color="white" />
            <Text style={styles.speakingIndicatorText}>Speaking…</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? BOTTOM_NAV_RESERVED_SPACE : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToEnd}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={sending}
          >
            <MaterialCommunityIcons
              name={isRecording ? "stop" : "microphone"}
              size={22}
              color="white"
            />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Kyerɛw wo asɛm (Twi/English)…"
            placeholderTextColor="#94a3b8"
            style={styles.textInput}
            editable={!sending}
            onSubmitEditing={sendText}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.sendButton, (sending || !input.trim()) && styles.sendButtonDisabled]}
            onPress={sendText}
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220" },
  header: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "white" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: "white", fontSize: 12, fontWeight: "500" },
  avatarErrorBanner: {
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  avatarErrorText: { color: "#fecaca", fontSize: 12 },
  avatarErrorHint: { color: "#fca5a5", fontSize: 11, marginTop: 2 },
  chatArea: { flex: 1 },
  messagesList: { flex: 1 },
  avatarWrap: {
    height: 260,
    backgroundColor: "#020617",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  speakingIndicator: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speakingIndicatorText: { color: "white", fontSize: 12 },
  messageList: { padding: 12, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#2563eb" },
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: "#1f2937" },
  bubbleEmergency: { backgroundColor: "#7f1d1d" },
  bubbleTextUser: { color: "white", fontSize: 15, lineHeight: 20 },
  bubbleTextAssistant: { color: "#e5e7eb", fontSize: 15, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    // BottomNav (components/BottomNav.js) is absolutely positioned at the
    // bottom of the screen on top of this screen's content. Without this,
    // its ~80px bar visually and functionally covers the text input and
    // mic button, making them unreachable.
    marginBottom: BOTTOM_NAV_RESERVED_SPACE,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonActive: { backgroundColor: "#ef4444" },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
});
