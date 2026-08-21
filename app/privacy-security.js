import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    dataSharing: true,
    marketingEmails: false,
    profileVisibility: true,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const SettingItem = ({ label, description, setting, onToggle, icon }) => (
    <View
      style={[
        styles.settingItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingInfo}>
          <View
            style={[styles.iconBox, { backgroundColor: colors.primary + "10" }]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={colors.primary}
            />
          </View>
          <View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              {label}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.muted }]}>
              {description}
            </Text>
          </View>
        </View>
        <Switch
          value={setting}
          onValueChange={onToggle}
          trackColor={{ false: "#ccc", true: colors.primary + "40" }}
          thumbColor={setting ? colors.primary : "#f4f4f4"}
        />
      </View>
    </View>
  );

  const ActionButton = ({ label, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.actionButton, { borderColor: color }]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
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
          Privacy & Security
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Security Settings
        </Text>

        <SettingItem
          label="Two-Factor Authentication"
          description="Add an extra layer of security"
          setting={settings.twoFactorAuth}
          onToggle={() => handleToggle("twoFactorAuth")}
          icon="lock-check"
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground },
            { marginTop: 24 },
          ]}
        >
          Privacy Settings
        </Text>

        <SettingItem
          label="Data Sharing"
          description="Allow us to improve your experience"
          setting={settings.dataSharing}
          onToggle={() => handleToggle("dataSharing")}
          icon="share-variant"
        />

        <SettingItem
          label="Marketing Emails"
          description="Receive promotional content"
          setting={settings.marketingEmails}
          onToggle={() => handleToggle("marketingEmails")}
          icon="email-multiple"
        />

        <SettingItem
          label="Profile Visibility"
          description="Let others see your public profile"
          setting={settings.profileVisibility}
          onToggle={() => handleToggle("profileVisibility")}
          icon="eye"
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground },
            { marginTop: 24 },
          ]}
        >
          Account Actions
        </Text>

        <ActionButton
          label="Download Your Data"
          icon="download"
          color={colors.primary}
          onPress={() => {}}
        />

        <ActionButton
          label="Delete Account"
          icon="trash-can"
          color="#dc2626"
          onPress={() => {}}
        />

        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="shield-check"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Your data is encrypted and secure
          </Text>
        </View>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  settingItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  actionButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: "#f0f4f2",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
});
