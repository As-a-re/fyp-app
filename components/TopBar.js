import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  return (
    <View style={styles.header}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="account" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    zIndex: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
});
