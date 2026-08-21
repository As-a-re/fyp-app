import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/theme";
import { callAPI } from "../services/api";

export function IncomingCallModal({
  visible,
  caller = {},
  callType = "audio",
  callId = null,
  onAccept = () => {},
  onReject = () => {},
}) {
  const router = useRouter();
  const colors = Colors.light;
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [ringTimeout, setRingTimeout] = useState(null);

  useEffect(() => {
    if (visible) {
      // Auto-reject call after 60 seconds if not answered
      const timeout = setTimeout(() => {
        handleReject();
      }, 60000);
      setRingTimeout(timeout);

      return () => clearTimeout(timeout);
    }
  }, [visible, handleReject]);

  const handleAccept = useCallback(async () => {
    try {
      setAccepting(true);

      if (callId) {
        await callAPI.acceptCall(callId);
      }

      // Clear timeout
      if (ringTimeout) {
        clearTimeout(ringTimeout);
      }

      onAccept();

      // Navigate to video call screen
      router.push({
        pathname: "/video-call",
        params: {
          doctorId: caller.id,
          doctorName: caller.name,
          callType,
        },
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      Alert.alert("Error", "Failed to accept call. Please try again.");
      setAccepting(false);
    }
  }, [callId, ringTimeout, onAccept, caller.id, caller.name, callType, router]);

  const handleReject = useCallback(async () => {
    try {
      setRejecting(true);

      if (callId) {
        await callAPI.rejectCall(callId);
      }

      if (ringTimeout) {
        clearTimeout(ringTimeout);
      }

      onReject();
    } catch (error) {
      console.error("Error rejecting call:", error);
      Alert.alert("Error", "Failed to reject call.");
      setRejecting(false);
    }
  }, [callId, ringTimeout, onReject]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleReject}
    >
      <View style={styles.container}>
        {/* Animated background */}
        <View
          style={[styles.background, { backgroundColor: colors.background }]}
        />

        {/* Call notification card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Caller info */}
          <View style={styles.callerSection}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name={callType === "video" ? "video" : "phone"}
                size={40}
                color="#fff"
              />
            </View>

            <Text style={[styles.callerName, { color: colors.text }]}>
              {caller.name || "Unknown Caller"}
            </Text>

            <Text style={[styles.callType, { color: colors.textSecondary }]}>
              {callType === "video" ? "Video Call" : "Voice Call"}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            {/* Reject button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.rejectButton,
                { backgroundColor: colors.error || "#ff6b6b" },
              ]}
              onPress={handleReject}
              disabled={rejecting || accepting}
            >
              <MaterialCommunityIcons
                name="phone-hangup"
                size={28}
                color="#fff"
              />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>

            {/* Accept button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.acceptButton,
                { backgroundColor: colors.success || "#51cf66" },
              ]}
              onPress={handleAccept}
              disabled={accepting || rejecting}
            >
              <MaterialCommunityIcons name="phone" size={28} color="#fff" />
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  callerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  callerName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  callType: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    // Primary accept styling
  },
  rejectButton: {
    // Danger reject styling
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default IncomingCallModal;
