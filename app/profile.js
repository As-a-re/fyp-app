import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      setProfileData(response.user || user);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by layout based on isAuthenticated state
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayUser = profileData || user;
  const isDoctor = displayUser?.role?.toLowerCase() === "doctor";

  const allProfileSections = [
    {
      title: "Account",
      items: [
        {
          icon: "account",
          label: "Personal Information",
          onPress: () => router.push("/edit-profile"),
        },
        {
          icon: "hospital-box",
          label: "Pregnancy Profile",
          onPress: () => router.push("/pregnancy-profile"),
        },
        {
          icon: "lock",
          label: "Change Password",
          onPress: () => router.push("/change-password"),
        },
      ],
    },
    {
      title: "Medical Records",
      items: [
        {
          icon: "file-document",
          label: "Test Results",
          onPress: () => router.push("/test-results"),
        },
        {
          icon: "syringe",
          label: "Vaccination Records",
          onPress: () => router.push("/vaccination-records"),
        },
        {
          icon: "calendar-check",
          label: "Appointments",
          onPress: () => router.push("/appointments"),
        },
      ],
    },
    {
      title: "Wellness",
      items: [
        {
          icon: "food",
          label: "Nutrition & Diet",
          onPress: () => router.push("/nutrition-diet"),
        },
        {
          icon: "run",
          label: "Exercise & Fitness",
          onPress: () => router.push("/exercise-fitness"),
        },
        {
          icon: "brain",
          label: "Mental Health",
          onPress: () => router.push("/mental-health-wellness"),
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: "bell",
          label: "Notifications",
          onPress: () => router.push("/notifications"),
        },
        {
          icon: "shield-check",
          label: "Privacy & Security",
          onPress: () => router.push("/privacy-security"),
        },
      ],
    },
  ];

  // Filter sections based on user role
  const profileSections = isDoctor
    ? allProfileSections
        .map((section) => {
          if (section.title === "Account") {
            return {
              ...section,
              items: section.items.filter(
                (item) => item.label !== "Pregnancy Profile",
              ),
            };
          }
          return section;
        })
        .filter(
          (section) => !["Medical Records", "Wellness"].includes(section.title),
        )
    : allProfileSections;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Profile
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* User Card */}
            <View style={[styles.userCard, { backgroundColor: colors.card }]}>
              <View
                style={[styles.avatar, { backgroundColor: colors.primary }]}
              >
                <MaterialCommunityIcons
                  name={
                    displayUser?.role === "doctor"
                      ? "stethoscope"
                      : "baby-carriage"
                  }
                  size={32}
                  color="#ffffff"
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.foreground }]}>
                  {displayUser?.name || "User"}
                </Text>
                <Text style={[styles.userRole, { color: colors.muted }]}>
                  {displayUser?.role === "doctor"
                    ? "Healthcare Provider"
                    : "Mother"}
                </Text>
                <Text style={[styles.userEmail, { color: colors.muted }]}>
                  {displayUser?.email}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.editIconButton,
                  { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => router.push("/edit-profile")}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Sections */}
            {profileSections.map((section, sIdx) => (
              <View key={sIdx} style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {section.title}
                </Text>
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={iIdx}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        borderBottomColor:
                          iIdx < section.items.length - 1
                            ? colors.border
                            : "transparent",
                      },
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View
                        style={[
                          styles.menuIconBox,
                          { backgroundColor: colors.primary + "10" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.menuLabel, { color: colors.foreground }]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: "#dc262610" }]}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#dc2626" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            {/* Version Info */}
            <Text style={[styles.version, { color: colors.muted }]}>
              MamaGuard v1.0.0
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: "400",
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderRadius: 12,
    marginBottom: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 12,
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 14,
  },
  version: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 16,
  },
});
