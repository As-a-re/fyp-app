import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { doctorAPI } from "../services/api";

const DoctorCard = ({ doctor, onPress, onMessage, colors }) => {
  const initials =
    doctor.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "DR";

  return (
    <View style={[styles.doctorCard, { backgroundColor: colors.card }]}>
      <View style={styles.doctorHeader}>
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={[styles.doctorName, { color: colors.text }]}>
            {doctor.name || "Doctor"}
          </Text>
          <Text style={[styles.doctorEmail, { color: colors.textSecondary }]}>
            {doctor.email}
          </Text>
          {doctor.phone && (
            <Text style={[styles.doctorPhone, { color: colors.textSecondary }]}>
              📞 {doctor.phone}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => onPress(doctor)}
        >
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
            View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: colors.primary }]}
          onPress={() => onMessage(doctor)}
        >
          <MaterialCommunityIcons name="message" size={20} color="#fff" />
          <Text style={[styles.messageButtonText]}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DoctorDetailModal = ({ doctor, colors, onClose, onMessage }) => {
  if (!doctor) return null;

  const initials =
    doctor.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "DR";

  return (
    <View
      style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.modalAvatarContainer}>
          <View
            style={[styles.modalAvatar, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.modalAvatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={[styles.modalDoctorName, { color: colors.text }]}>
          {doctor.name}
        </Text>
        <Text style={[styles.modalEmail, { color: colors.textSecondary }]}>
          {doctor.email}
        </Text>

        {doctor.phone && (
          <View style={styles.contactInfoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.contactInfo, { color: colors.text }]}>
              {doctor.phone}
            </Text>
          </View>
        )}

        <View style={styles.registeredDateRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
            Registered: {new Date(doctor.created_at).toLocaleDateString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.modalMessageButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => {
            onMessage(doctor);
            onClose();
          }}
        >
          <MaterialCommunityIcons name="message" size={20} color="#fff" />
          <Text style={styles.modalMessageButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function BrowseDoctorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = Colors.light;
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
    }, []),
  );

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorAPI.browseDoctors();
      const doctorsList = response.doctors || [];
      setDoctors(doctorsList);
      setFilteredDoctors(doctorsList);
    } catch (error) {
      console.error("Error loading doctors:", error);
      Alert.alert("Error", "Failed to load doctors list");
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(
        (doctor) =>
          doctor.name?.toLowerCase().includes(query.toLowerCase()) ||
          doctor.email?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredDoctors(filtered);
    }
  };

  const handleMessageDoctor = async (doctor) => {
    try {
      // Navigate to a conversation with pre-selected doctor
      router.push({
        pathname: "/chat-doctor",
        params: { doctorId: doctor.id, doctorName: doctor.name },
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start conversation");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading doctors...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Find a Doctor
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Connect with our registered healthcare professionals
        </Text>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {filteredDoctors.length > 0 ? (
        <FlatList
          data={filteredDoctors}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={setSelectedDoctor}
              onMessage={handleMessageDoctor}
              colors={colors}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="hospital-box"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {searchQuery ? "No doctors found" : "No doctors available"}
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            {searchQuery ? "Try a different search" : "Please check back later"}
          </Text>
        </View>
      )}

      <DoctorDetailModal
        doctor={selectedDoctor}
        colors={colors}
        onClose={() => setSelectedDoctor(null)}
        onMessage={handleMessageDoctor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  doctorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  doctorHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  doctorInfo: {
    flex: 1,
    justifyContent: "center",
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  doctorEmail: {
    fontSize: 13,
    marginBottom: 3,
  },
  doctorPhone: {
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  modalDoctorName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  modalEmail: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  contactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingVertical: 8,
  },
  registeredDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingVertical: 8,
  },
  contactInfo: {
    fontSize: 14,
    marginLeft: 12,
  },
  modalMessageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modalMessageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
