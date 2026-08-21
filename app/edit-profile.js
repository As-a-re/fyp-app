import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import { userAPI } from "../services/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date_of_birth: user?.date_of_birth || "",
    blood_type: user?.blood_type || "",
  });

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Call backend API to update profile
      await userAPI.updateProfile(formData);
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Edit Profile
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="account" size={48} color="#ffffff" />
          </View>
          <TouchableOpacity
            style={[
              styles.changeAvatarButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <MaterialCommunityIcons name="camera" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <FormField
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            icon="account"
            colors={colors}
          />

          <FormField
            label="Email Address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            icon="email"
            keyboardType="email-address"
            colors={colors}
          />

          <FormField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            icon="phone"
            keyboardType="phone-pad"
            colors={colors}
          />

          <FormField
            label="Date of Birth"
            value={formData.date_of_birth}
            onChangeText={(text) =>
              setFormData({ ...formData, date_of_birth: text })
            }
            icon="calendar"
            placeholder="YYYY-MM-DD"
            colors={colors}
          />

          {/* Blood Type Selector */}
          <View style={styles.fieldGroup}>
            <Label label="Blood Type" colors={colors} />
            <View style={styles.bloodTypeGrid}>
              {bloodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeButton,
                    {
                      backgroundColor:
                        formData.blood_type === type
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        formData.blood_type === type
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, blood_type: type })}
                >
                  <Text
                    style={[
                      styles.bloodTypeText,
                      {
                        color:
                          formData.blood_type === type
                            ? "#ffffff"
                            : colors.foreground,
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  icon,
  keyboardType,
  placeholder,
  colors,
}) {
  return (
    <View style={styles.fieldGroup}>
      <Label label={label} colors={colors} />
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
        />
      </View>
    </View>
  );
}

function Label({ label, colors }) {
  return (
    <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  changeAvatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    right: 90,
  },
  formSection: {
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  bloodTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bloodTypeButton: {
    width: "23%",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#2d9d78",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
