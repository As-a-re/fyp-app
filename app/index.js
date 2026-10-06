import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      }
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Prenatal Care System</Text>
          <Text style={styles.subtitle}>Loading your health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) return null;

  return (
    <SafeAreaView style={styles.landingContainer}>
      <View style={styles.landingContent}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color="#f8f3e9" />
          </View>
          <Text style={styles.brandName}>MamaGuard</Text>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <MaterialCommunityIcons name="mother-nurse" size={82} color="#b8ddd0" style={styles.heroIcon} />
          <Text style={styles.eyebrow}>CARE THAT STAYS WITH YOU</Text>
          <Text style={styles.heroTitle}>A calmer pregnancy starts here.</Text>
          <Text style={styles.heroCopy}>
            Keep your health, appointments, and trusted care team close at every step.
          </Text>
          <View style={styles.trustRow}>
            <View style={styles.trustIcon}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#0d5b56" />
            </View>
            <Text style={styles.trustText}>Private, supportive, and built for real life</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <Feature icon="calendar-heart" label="Appointments" />
          <Feature icon="stethoscope" label="Care team" />
          <Feature icon="chart-line" label="Health insights" />
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/register")} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Create your account</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#f8f3e9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/login")} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, label }) {
  return (
    <View style={styles.feature}>
      <MaterialCommunityIcons name={icon} size={20} color="#0d5b56" />
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.foreground,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    marginTop: 8,
  },
  landingContainer: {
    flex: 1,
    backgroundColor: "#f4f0e8",
  },
  landingContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d5b56",
  },
  brandName: {
    color: "#123b38",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroPanel: {
    minHeight: Math.min(Dimensions.get("window").height * 0.47, 410),
    borderRadius: 30,
    overflow: "hidden",
    padding: 26,
    justifyContent: "flex-end",
    backgroundColor: "#0d5b56",
  },
  heroOrbLarge: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#176f68",
    top: -88,
    right: -55,
  },
  heroOrbSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: "rgba(184, 221, 208, 0.35)",
    top: 32,
    left: -42,
  },
  heroIcon: {
    position: "absolute",
    top: 38,
    right: 32,
  },
  eyebrow: {
    color: "#b8ddd0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  heroTitle: {
    color: "#f8f3e9",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "800",
    maxWidth: 300,
  },
  heroCopy: {
    color: "#d2e8df",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 310,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    gap: 9,
  },
  trustIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#b8ddd0",
    alignItems: "center",
    justifyContent: "center",
  },
  trustText: {
    color: "#f8f3e9",
    fontSize: 12,
    fontWeight: "600",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  feature: {
    alignItems: "center",
    gap: 7,
  },
  featureLabel: {
    color: "#49625c",
    fontSize: 11,
    fontWeight: "700",
  },
  actionGroup: {
    gap: 10,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0d5b56",
  },
  primaryButtonText: {
    color: "#f8f3e9",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#0d5b56",
    fontSize: 14,
    fontWeight: "800",
  },
});
