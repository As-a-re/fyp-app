import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("mother");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password, selectedRole);

      if (result.success) {
        console.log("Login successful, redirecting to dashboard...");
        router.replace("/dashboard");
      } else {
        Alert.alert("Login Failed", result.error || "Invalid credentials");
      }
    } catch (_error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const colors = Colors.light;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#2d9d78", "#3eaf8f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <MaterialCommunityIcons
                  name="heart"
                  size={32}
                  color="#ffffff"
                />
              </LinearGradient>
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>
              MamaGuard
            </Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>
              Maternal health, reimagined
            </Text>
          </View>

          {/* Role Selector */}
          <View style={styles.roleSection}>
            <Text style={[styles.roleLabel, { color: colors.foreground }]}>
              I am a
            </Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "mother" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  selectedRole !== "mother" && {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedRole("mother")}
              >
                <MaterialCommunityIcons
                  name="baby"
                  size={20}
                  color={
                    selectedRole === "mother" ? "#ffffff" : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    {
                      color:
                        selectedRole === "mother"
                          ? "#ffffff"
                          : colors.foreground,
                    },
                  ]}
                >
                  Mother
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "doctor" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  selectedRole !== "doctor" && {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedRole("doctor")}
              >
                <MaterialCommunityIcons
                  name="stethoscope"
                  size={20}
                  color={
                    selectedRole === "doctor" ? "#ffffff" : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    {
                      color:
                        selectedRole === "doctor"
                          ? "#ffffff"
                          : colors.foreground,
                    },
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: colors.card }]}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: colors.foreground }]}>
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/register")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.signupLink,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "500",
  },
  roleSection: {
    marginBottom: 28,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  form: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#2d9d78",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 13,
    fontWeight: "500",
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
  },
});
