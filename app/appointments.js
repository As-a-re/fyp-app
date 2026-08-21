import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { appointmentAPI } from "../services/api";

const DoctorCard = ({ doctor, colors, onPress }) => {
  const image =
    doctor.image ||
    doctor.avatar ||
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=80";
  const specialty = doctor.specialty || doctor.specialization || "Doctor";
  const rating = doctor.rating || 0;
  const reviews = doctor.reviews || doctor.review_count || 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <Image source={{ uri: image }} style={styles.doctorImage} />
      <View style={styles.cardContent}>
        <Text style={[styles.doctorName, { color: colors.text }]}>
          {doctor.name}
        </Text>
        <Text style={[styles.doctorSpecialty, { color: colors.textSecondary }]}>
          {specialty}
        </Text>
        {rating > 0 && (
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {rating}
            </Text>
            <Text style={[styles.reviewsText, { color: colors.textSecondary }]}>
              ({reviews} reviews)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function AppointmentsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
    }, []),
  );

  const loadDoctors = async () => {
    setLoading(true);
    try {
      // Try to get available doctors for appointments
      const response = await appointmentAPI.getAvailableDoctors?.({
        limit: 50,
      });
      if (response?.doctors) {
        setDoctors(response.doctors);
      } else {
        // Fallback: set empty state if endpoint doesn't exist
        setDoctors([]);
      }
    } catch (error) {
      console.log("Could not load doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor) => {
    router.push({
      pathname: "/book-appointment",
      params: { doctorId: doctor.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          Book Appointment
        </Text>
      </View>
      {doctors.length > 0 ? (
        <FlatList
          data={doctors}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              colors={colors}
              onPress={() => handleBookAppointment(item)}
            />
          )}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No available doctors
          </Text>
        </View>
      )}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 80 },
  card: {
    flexDirection: "row",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  cardContent: { flex: 1, justifyContent: "center" },
  doctorName: { fontSize: 18, fontWeight: "bold" },
  doctorSpecialty: { fontSize: 14, marginVertical: 4 },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  ratingText: { marginLeft: 5, fontWeight: "bold" },
  reviewsText: { marginLeft: 8, fontSize: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
