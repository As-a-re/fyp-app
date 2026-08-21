import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const motherTabs = [
    { path: "/dashboard", icon: "home", label: "Dashboard" },
    { path: "/health-monitoring", icon: "heart-pulse", label: "Health" },
    { path: "/browse-doctors", icon: "hospital-box", label: "Doctors" },
    { path: "/messages", icon: "chat", label: "Chat" },
    { path: "/emergency", icon: "alert-circle", label: "Alert" },
  ];

  const doctorTabs = [
    { path: "/dashboard", icon: "home", label: "Dashboard" },
    { path: "/messages", icon: "chat", label: "Chat" },
    { path: "/profile", icon: "account", label: "Profile" },
  ];

  const tabs = user?.role?.toLowerCase() === "doctor" ? doctorTabs : motherTabs;

  return (
    <View style={styles.navContainer}>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <TouchableOpacity
              key={tab.path}
              style={styles.navItem}
              onPress={() => router.push(tab.path)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={isActive ? Colors.light.primary : "#94a3b8"}
              />
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: 10,
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeLabel: {
    color: Colors.light.primary,
  },
});
