import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { loading, isAuthenticated, checkAuthStatus } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    // Check authentication status when app starts
    checkAuthStatus();
  }, [checkAuthStatus]);

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

  return null; // This will redirect immediately after loading
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
});
