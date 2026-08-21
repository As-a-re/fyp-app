import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";

export default function EmergencyScreen() {
  const router = useRouter();
  const colors = Colors.light;

  const dangerSigns = [
    "Severe headache that won't go away",
    "Blurred vision or seeing black spots",
    "Swelling of face, hands, or feet",
    "Heavy vaginal bleeding",
    "High fever (above 38°C / 100.4°F)",
    "Reduced or no fetal movement",
  ];

  const handleCallDoctor = () => {
    // This would typically open the phone dialer or messaging app
    // For now, we'll navigate to messages
    router.push("/messages");
  };

  const handleNearestHospital = () => {
    // This would typically open maps or navigate to hospital finder
    // For now, we'll show a placeholder
    router.push("/appointments");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.foreground}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Emergency
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Emergency Alert Box */}
        <View style={styles.alertContainer}>
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color="#E63946"
            />
          </View>
          <Text style={styles.alertTitle}>Emergency Alert</Text>
          <Text style={styles.alertDescription}>
            If you are experiencing severe symptoms such as heavy bleeding,
            severe headache, blurred vision, or sudden swelling, please seek
            immediate medical attention.
          </Text>
        </View>

        {/* Recommended Actions Section */}
        <View style={styles.recommendedSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recommended Actions
          </Text>

          <View style={styles.dangerSignsContainer}>
            <Text
              style={[styles.dangerSignsTitle, { color: colors.foreground }]}
            >
              Danger Signs to Watch For:
            </Text>

            {dangerSigns.map((sign, index) => (
              <View key={index} style={styles.dangerSignItem}>
                <Text style={styles.dangerSignBullet}>•</Text>
                <Text
                  style={[styles.dangerSignText, { color: colors.foreground }]}
                >
                  {sign}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.callDoctorButton, { marginBottom: 16 }]}
            onPress={handleCallDoctor}
          >
            <MaterialCommunityIcons name="phone" size={24} color="#ffffff" />
            <Text style={styles.callDoctorButtonText}>Call Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.hospitalButton,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={handleNearestHospital}
          >
            <MaterialCommunityIcons
              name="hospital-box"
              size={24}
              color={colors.foreground}
            />
            <Text
              style={[styles.hospitalButtonText, { color: colors.foreground }]}
            >
              Nearest Hospital
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom nav */}
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e7e3",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  alertContainer: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#FFE8E8",
    borderWidth: 1,
    borderColor: "#FFD0D0",
    alignItems: "center",
  },
  alertIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD0D0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E63946",
    marginBottom: 8,
    textAlign: "center",
  },
  alertDescription: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
    textAlign: "center",
  },

  recommendedSection: {
    marginHorizontal: 16,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dangerSignsContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerSignsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  dangerSignItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  dangerSignBullet: {
    fontSize: 16,
    color: "#555555",
    marginRight: 10,
    fontWeight: "bold",
  },
  dangerSignText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  buttonsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  callDoctorButton: {
    backgroundColor: "#E63946",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callDoctorButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  hospitalButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  hospitalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
