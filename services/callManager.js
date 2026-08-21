import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { IncomingCallModal } from "../components/IncomingCallModal";
import { Colors } from "../constants/theme";
import { callAPI } from "../services/api";

/**
 * CallManager Hook
 *
 * This hook should be integrated into your main app layout (_layout.js)
 * to handle incoming calls globally for doctors and mothers.
 *
 * Usage:
 * const { CallModalComponent, startListening, stopListening } = useCallManager();
 *
 * Then in useEffect:
 * useEffect(() => {
 *   startListening();
 *   return () => stopListening();
 * }, []);
 *
 * And return CallModalComponent in your render
 */

export function useCallManager() {
  const [incomingCall, setIncomingCall] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);

  // Check for active calls periodically
  const startListening = () => {
    // Check for active calls every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await callAPI.getActiveCall();
        if (response.activeCall && response.activeCall.status === "initiated") {
          // New incoming call detected
          if (!showCallModal) {
            setIncomingCall(response.activeCall);
            setShowCallModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking for active calls:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const stopListening = () => {
    // Cleanup function
  };

  const handleAcceptCall = () => {
    setShowCallModal(false);
    // Navigation is handled by IncomingCallModal component
  };

  const handleRejectCall = () => {
    setShowCallModal(false);
    setIncomingCall(null);
  };

  const CallModalComponent = (
    <IncomingCallModal
      visible={showCallModal}
      caller={incomingCall?.caller_info || {}}
      callType={incomingCall?.call_type || "audio"}
      callId={incomingCall?.id}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
    />
  );

  return {
    CallModalComponent,
    startListening,
    stopListening,
    incomingCall,
    showCallModal,
  };
}

/**
 * Integration Example for _layout.js
 *
 * import { useCallManager } from '../services/callManager';
 *
 * export default function Layout() {
 *   const { CallModalComponent, startListening, stopListening } = useCallManager();
 *
 *   useEffect(() => {
 *     const unsubscribe = startListening();
 *     return () => {
 *       unsubscribe?.();
 *       stopListening();
 *     };
 *   }, []);
 *
 *   return (
 *     <>
 *       <Stack />
 *       {CallModalComponent}
 *     </>
 *   );
 * }
 */

// For testing, here's a standalone component you can use
export function CallManagerOverlay() {
  const { CallModalComponent, startListening, stopListening } =
    useCallManager();
  const [isActive, setIsActive] = useState(false);
  const colors = Colors.light;

  const toggleListening = () => {
    if (isActive) {
      stopListening();
      setIsActive(false);
    } else {
      startListening();
      setIsActive(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Testing button - remove in production */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: isActive ? colors.success : colors.error },
        ]}
        onPress={toggleListening}
      >
        <MaterialCommunityIcons
          name={isActive ? "phone" : "phone-off"}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Modal for displaying incoming calls */}
      {CallModalComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default useCallManager;
