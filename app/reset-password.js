import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/theme";
import { authAPI } from "../services/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const colors = Colors.light;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token || typeof token !== "string") return Alert.alert("Invalid link", "This password reset link is incomplete.");
    if (password.length < 6) return Alert.alert("Invalid password", "Use at least 6 characters.");
    if (password !== confirmPassword) return Alert.alert("Passwords do not match", "Enter the same password twice.");
    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, password);
      Alert.alert("Password updated", response.message, [{ text: "Log in", onPress: () => router.replace("/login") }]);
    } catch (error) {
      Alert.alert("Reset failed", error.message || "This link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Set a new password</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Choose a new password for your MamaGuard account.</Text>
        <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} placeholder="New password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} editable={!loading} />
        <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} placeholder="Confirm new password" placeholderTextColor={colors.muted} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} editable={!loading} />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update password</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, marginTop: 80 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 8, marginBottom: 28, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 14 },
  button: { padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "700" },
});