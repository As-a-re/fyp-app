import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { aiAPI } from "../services/api";

// English-only Tavus video avatar path. Twi conversations never reach this
// component - the language gate screen (app/ai-assistant.js) routes Twi
// straight to TwiAIComponent instead, so there is no language switcher or
// translation bridge here anymore.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "300",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webViewHeader: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webViewCloseButton: {
    padding: 8,
  },
  webViewCloseText: {
    fontSize: 24,
    color: "white",
    fontWeight: "300",
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  endSessionButton: {
    backgroundColor: "rgba(255,59,48,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endSessionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  webView: {
    flex: 1,
  },
  controlBar: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  controlContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    gap: 4,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  micOnButton: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  micOffButton: {
    backgroundColor: "rgba(255,59,48,0.2)",
  },
  endButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 4,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function TavusAIAssistant() {
  const [status, setStatus] = useState("idle");
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [WebViewComponent, setWebViewComponent] = useState(null);
  const webViewRef = useRef(null);

  // Dynamically import WebView only on native platforms
  useEffect(() => {
    if (Platform.OS !== "web") {
      try {
        const { WebView } = require("react-native-webview");
        setWebViewComponent(() => WebView);
      } catch (error) {
        console.error("Failed to load WebView:", error);
      }
    }
  }, []);

  const startConversation = async () => {
    setIsLoading(true);
    setStatus("connecting");

    try {
      const response = await aiAPI.createConversation({ language: "en" });
      setActiveSession(response.conversation);
      setStatus("active");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      const tavusMessage =
        error.status === 402
          ? `${error.message || "Tavus rejected the conversation request"}\n\nThis is usually an account/plan/usage restriction on Tavus, not an Expo issue. Check the Tavus Developer Portal for the API key/account being used.${error.hint ? `\n\n${error.hint}` : ""}`
          : (error.message || "Failed to start Tavus conversation");
      Alert.alert("Tavus Conversation Error", tavusMessage);
      setStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = async () => {
    if (!activeSession) {
      setStatus("idle");
      return;
    }

    setIsLoading(true);
    try {
      if (activeSession.conversation_id) {
        await aiAPI.endSession(activeSession.conversation_id);
      } else if (activeSession.session_id) {
        await aiAPI.endSession(activeSession.session_id);
      }
      setActiveSession(null);
      setStatus("idle");
    } catch (error) {
      console.error("Failed to end conversation:", error);
      setActiveSession(null);
      setStatus("idle");
      Alert.alert("Info", "Conversation closed locally.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "#34C759";
      case "connecting":
        return "#FF9500";
      default:
        return "#8E8E93";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "active":
        return "Live Connection";
      case "connecting":
        return "Establishing...";
      default:
        return "Ready";
    }
  };

  // Render active conversation - WEB PLATFORM
  if (Platform.OS === "web") {
    if (activeSession && activeSession.conversation_url) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100vh",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              backgroundColor: "#007AFF",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "white",
              zIndex: 10,
            }}
          >
            <button
              onClick={() => {
                setActiveSession(null);
                setStatus("idle");
              }}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                padding: "8px",
              }}
            >
              ✕
            </button>
            <h2
              style={{
                margin: 0,
                flex: 1,
                textAlign: "center",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Tavus Conversation
            </h2>
            <button
              onClick={endConversation}
              style={{
                background: "rgba(255,59,48,0.2)",
                border: "none",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              End
            </button>
          </div>
          <iframe
            src={activeSession.conversation_url}
            style={{
              flex: 1,
              width: "100%",
              border: "none",
            }}
            allow="microphone; camera; accelerometer; gyroscope"
            title="Tavus Session"
          />
        </div>
      );
    }

    // Idle state for web
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          style={{
            backgroundColor: "#007AFF",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            Tavus AI Assistant
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingTop: "6px",
              paddingBottom: "6px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                marginRight: "6px",
                backgroundColor: getStatusColor(),
              }}
            />
            {getStatusText()}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "500px",
            }}
          >
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "300",
                marginBottom: "12px",
                color: "#333",
              }}
            >
              Connect with <strong>M-CARE</strong>
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "24px",
              }}
            >
              Get personalized prenatal care guidance with our AI assistant, in English
            </p>

            <button
              onClick={startConversation}
              disabled={isLoading}
              style={{
                backgroundColor: "#007AFF",
                color: "white",
                padding: "12px 32px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? "Starting..." : "Start Conversation"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NATIVE PLATFORMS (iOS, Android)
  // Render idle state
  if (status === "idle" && !activeSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tavus AI Assistant</Text>
          <View style={styles.statusBadge}>
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
            />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>
              Connect with <Text style={{ fontWeight: "600" }}>M-CARE</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Get personalized prenatal care guidance with our AI assistant, in English
            </Text>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startConversation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.startButtonText}>Start Conversation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render connecting state
  if (status === "connecting" && !activeSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tavus AI Assistant</Text>
          <View style={styles.statusBadge}>
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
            />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={[styles.contentContainer, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, color: "#666" }}>
            Initializing conversation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  // Render active conversation - NATIVE PLATFORMS
  if (activeSession && activeSession.conversation_url && Platform.OS !== "web") {
    return (
      <SafeAreaView style={styles.webViewContainer}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            style={styles.webViewCloseButton}
            onPress={() => {
              setActiveSession(null);
              setStatus("idle");
            }}
          >
            <Text style={styles.webViewCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Tavus Conversation</Text>
          <TouchableOpacity
            style={styles.endSessionButton}
            onPress={endConversation}
          >
            <Text style={styles.endSessionText}>End</Text>
          </TouchableOpacity>
        </View>

        {WebViewComponent ? (
          <WebViewComponent
            ref={webViewRef}
            source={{ uri: activeSession.conversation_url }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            onError={(error) => {
              console.error("WebView error:", error);
              Alert.alert("Error", "Failed to load conversation");
            }}
          />
        ) : (
          <View style={styles.webView}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        <View style={styles.controlBar}>
          <View style={styles.controlContainer}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isMuted ? styles.micOffButton : styles.micOnButton,
              ]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <MaterialCommunityIcons
                name={isMuted ? "microphone-off" : "microphone"}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.endButton}
              onPress={endConversation}
            >
              <MaterialCommunityIcons
                name="phone-hangup"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}
