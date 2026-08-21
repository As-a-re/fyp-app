import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { userAPI } from "../services/api";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleChangePassword = async () => {
    try {
      if (!formData.currentPassword) {
        setError("Current password is required");
        return;
      }
      if (!formData.newPassword) {
        setError("New password is required");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      await userAPI.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ label, field, showKey }) => (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View
        style={[
          styles.passwordInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.passwordField, { color: colors.foreground }]}
          placeholder="Enter password"
          placeholderTextColor={colors.muted}
          secureTextEntry={!showPasswords[showKey]}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
        />
        <TouchableOpacity
          onPress={() =>
            setShowPasswords((prev) => ({
              ...prev,
              [showKey]: !prev[showKey],
            }))
          }
        >
          <MaterialCommunityIcons
            name={showPasswords[showKey] ? "eye" : "eye-off"}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Change Password
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error Message */}
        {error ? (
          <View
            style={[
              styles.messageBox,
              { backgroundColor: "#dc262610", borderColor: "#dc2626" },
            ]}
          >
            <MaterialCommunityIcons name="alert" size={20} color="#dc2626" />
            <Text style={[styles.messageText, { color: "#dc2626" }]}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Success Message */}
        {success ? (
          <View
            style={[
              styles.messageBox,
              { backgroundColor: "#3db87010", borderColor: "#3db870" },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#3db870"
            />
            <Text style={[styles.messageText, { color: "#3db870" }]}>
              {success}
            </Text>
          </View>
        ) : null}

        <PasswordField
          label="Current Password"
          field="currentPassword"
          showKey="current"
        />
        <PasswordField label="New Password" field="newPassword" showKey="new" />
        <PasswordField
          label="Confirm Password"
          field="confirmPassword"
          showKey="confirm"
        />

        {/* Change Button */}
        <TouchableOpacity
          style={[
            styles.changeButton,
            { backgroundColor: colors.primary },
            loading && { opacity: 0.6 },
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="lock-reset"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.changeButtonText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 12,
  },
  passwordField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  changeButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
});
