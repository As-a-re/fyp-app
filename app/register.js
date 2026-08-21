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

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Mother",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, phone } = formData;

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields");
      return false;
    }

    if (name.length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters");
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    if (phone && phone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);

      if (result.success) {
        // Show success message and redirect to login
        Alert.alert(
          "Registration Successful",
          `Welcome, ${formData.name}! Your account has been created. Please login with your credentials.`,
          [
            {
              text: "Go to Login",
              onPress: () => {
                setLoading(false);
                router.replace("/login");
              },
            },
          ],
        );
      } else {
        setLoading(false);
        Alert.alert("Registration Failed", result.error || "Unknown error");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", error.message || "An unexpected error occurred");
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
                  formData.role === "Mother" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  formData.role !== "Mother" && {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleInputChange("role", "Mother")}
              >
                <MaterialCommunityIcons
                  name="baby"
                  size={20}
                  color={
                    formData.role === "Mother" ? "#ffffff" : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    {
                      color:
                        formData.role === "Mother"
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
                  formData.role === "Doctor" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  formData.role !== "Doctor" && {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleInputChange("role", "Doctor")}
              >
                <MaterialCommunityIcons
                  name="stethoscope"
                  size={20}
                  color={
                    formData.role === "Doctor" ? "#ffffff" : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    {
                      color:
                        formData.role === "Doctor"
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
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Full Name
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
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

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
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
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
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Confirm Password
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
                value={formData.confirmPassword}
                onChangeText={(value) =>
                  handleInputChange("confirmPassword", value)
                }
                placeholder="Confirm your password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Phone Number (Optional)
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
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.foreground }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.loginLink,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Text */}
          <View style={styles.termsContainer}>
            <Text style={[styles.termsText, { color: colors.muted }]}>
              By signing up, you agree to our Terms of Service and Privacy
              Policy
            </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
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
    marginBottom: 24,
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
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  registerButton: {
    backgroundColor: "#2d9d78",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  registerButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 13,
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  termsContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  termsText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
