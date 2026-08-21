import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { callAPI } from "../services/api";
import { callService } from "../services/callService";

const AGORA_APP_ID =
  process.env.EXPO_PUBLIC_AGORA_APP_ID || "d128c1eb210449f0a5a3556e19bd35de";

export default function VideoCallScreen() {
  const router = useRouter();
  const { doctorId, doctorName, callType = "audio" } = useLocalSearchParams();
  const { user } = useAuth();
  const colors = Colors.light;

  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(callType === "audio");
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const endCall = useCallback(async () => {
    try {
      await callService.leaveCall();

      // Notify backend that call ended
      const channelName = `call_${user?.id}_${doctorId}`;
      await callAPI.endCall(channelName);

      router.back();
    } catch (error) {
      console.error("Error ending call:", error);
      router.back();
    }
  }, [user?.id, doctorId, router]);

  const initializeAndJoinCall = useCallback(async () => {
    try {
      // Initialize Agora Engine
      await callService.initializeEngine(AGORA_APP_ID);

      // Get call token from backend
      const channelName = `call_${user?.id}_${doctorId}`;
      const tokenResponse = await callAPI.getCallToken(channelName, callType);

      if (!tokenResponse.token) {
        throw new Error("Failed to get call token");
      }

      // Join the call
      await callService.joinCall(
        tokenResponse.token,
        channelName,
        user?.id || Math.floor(Math.random() * 10000),
      );

      setLoading(false);

      // Initiate call notification to doctor
      await callAPI.initiateCall({
        recipient_id: doctorId,
        call_type: callType,
        channel_name: channelName,
      });
    } catch (error) {
      console.error("Failed to initialize call:", error);
      Alert.alert("Call Error", error.message || "Failed to start call");
      setLoading(false);
      router.back();
    }
  }, [user?.id, doctorId, callType, router]);

  useEffect(() => {
    initializeAndJoinCall();

    const durationInterval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(durationInterval);
      endCall();
    };
  }, [initializeAndJoinCall, endCall]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleMute = async () => {
    try {
      await callService.muteAudio(!audioMuted);
      setAudioMuted(!audioMuted);
    } catch (_error) {
      Alert.alert("Error", "Failed to toggle audio");
    }
  };

  const handleToggleVideo = async () => {
    try {
      if (callType === "video") {
        await callService.muteVideo(!videoMuted);
        setVideoMuted(!videoMuted);
      }
    } catch (_error) {
      Alert.alert("Error", "Failed to toggle video");
    }
  };

  const handleSwitchCamera = async () => {
    try {
      if (callType === "video") {
        await callService.switchCamera();
      }
    } catch (_error) {
      Alert.alert("Error", "Failed to switch camera");
    }
  };

  const handleToggleSpeaker = async () => {
    try {
      await callService.enableSpeaker(!speakerEnabled);
      setSpeakerEnabled(!speakerEnabled);
    } catch (_error) {
      Alert.alert("Error", "Failed to toggle speaker");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name={callType === "video" ? "video" : "phone"}
            size={64}
            color={colors.primary}
          />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Connecting to {doctorName}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.doctorName, { color: colors.text }]}>
          {doctorName}
        </Text>
        <Text style={[styles.callType, { color: colors.textSecondary }]}>
          {callType === "video" ? "Video Call" : "Voice Call"}
        </Text>
        <Text style={[styles.duration, { color: colors.textSecondary }]}>
          {formatDuration(callDuration)}
        </Text>
      </View>

      <View style={styles.spacer} />

      {/* Video View - only for video calls */}
      {callType === "video" && (
        <View style={[styles.videoContainer, { borderColor: colors.border }]}>
          <Text
            style={[styles.videoPlaceholder, { color: colors.textSecondary }]}
          >
            📹 Video Stream
          </Text>
        </View>
      )}

      <View style={styles.spacer} />

      {/* Controls */}
      <View style={styles.controls}>
        {/* Mute Audio Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: audioMuted
                ? colors.error || "#ff6b6b"
                : colors.card,
            },
          ]}
          onPress={handleToggleMute}
        >
          <MaterialCommunityIcons
            name={audioMuted ? "microphone-off" : "microphone"}
            size={28}
            color={audioMuted ? "#fff" : colors.primary}
          />
        </TouchableOpacity>

        {/* Toggle Video Button - only for video calls */}
        {callType === "video" && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: videoMuted
                  ? colors.error || "#ff6b6b"
                  : colors.card,
              },
            ]}
            onPress={handleToggleVideo}
          >
            <MaterialCommunityIcons
              name={videoMuted ? "video-off" : "video"}
              size={28}
              color={videoMuted ? "#fff" : colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Switch Camera Button - only for video calls */}
        {callType === "video" && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={handleSwitchCamera}
          >
            <MaterialCommunityIcons
              name="camera-flip"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Speaker Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: speakerEnabled
                ? colors.card
                : colors.error || "#ff6b6b",
            },
          ]}
          onPress={handleToggleSpeaker}
        >
          <MaterialCommunityIcons
            name={speakerEnabled ? "volume-high" : "volume-off"}
            size={28}
            color={speakerEnabled ? colors.primary : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {/* End Call Button */}
      <TouchableOpacity
        style={[
          styles.endCallButton,
          { backgroundColor: colors.error || "#ff6b6b" },
        ]}
        onPress={endCall}
      >
        <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  callType: {
    fontSize: 14,
    marginBottom: 8,
  },
  duration: {
    fontSize: 18,
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
  videoContainer: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  videoPlaceholder: {
    fontSize: 48,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  endCallButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  endCallText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: "500",
  },
});
