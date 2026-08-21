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

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    appointmentReminders: true,
    healthAlerts: true,
    messageNotifications: true,
    weeklyReport: false,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NotificationItem = ({ label, description, setting, onToggle }) => (
    <View
      style={[
        styles.notificationItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.notificationInfo}>
        <Text style={[styles.notificationLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[styles.notificationDescription, { color: colors.muted }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={setting}
        onValueChange={onToggle}
        trackColor={{ false: "#ccc", true: colors.primary + "40" }}
        thumbColor={setting ? colors.primary : "#f4f4f4"}
      />
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
          Notifications
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Notification Preferences
        </Text>

        <NotificationItem
          label="Push Notifications"
          description="Receive app notifications"
          setting={settings.pushNotifications}
          onToggle={() => handleToggle("pushNotifications")}
        />

        <NotificationItem
          label="Email Notifications"
          description="Receive updates via email"
          setting={settings.emailNotifications}
          onToggle={() => handleToggle("emailNotifications")}
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground },
            { marginTop: 24 },
          ]}
        >
          Notification Types
        </Text>

        <NotificationItem
          label="Appointment Reminders"
          description="Get reminded about upcoming appointments"
          setting={settings.appointmentReminders}
          onToggle={() => handleToggle("appointmentReminders")}
        />

        <NotificationItem
          label="Health Alerts"
          description="Important health-related notifications"
          setting={settings.healthAlerts}
          onToggle={() => handleToggle("healthAlerts")}
        />

        <NotificationItem
          label="Message Notifications"
          description="Alerts when you receive new messages"
          setting={settings.messageNotifications}
          onToggle={() => handleToggle("messageNotifications")}
        />

        <NotificationItem
          label="Weekly Health Report"
          description="Receive a summary of your health data"
          setting={settings.weeklyReport}
          onToggle={() => handleToggle("weeklyReport")}
        />

        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Changes are saved automatically
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
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    fontWeight: "500",
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
