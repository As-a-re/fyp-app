import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { doctorAPI } from "../services/api";

export default function PatientsScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [patients, setPatients] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, []),
  );

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Call backend API to fetch patients
      const response = await doctorAPI.getPatients({ limit: 50 });
      setPatients(response.patients || []);
    } catch (error) {
      console.error("Error loading patients:", error);
      Alert.alert("Error", "Failed to load patients list");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const getRiskColor = (risk) => {
    switch (risk) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#ffa500";
      case "low":
      default:
        return "#3db870";
    }
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.patientCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => router.push(`/patient-detail/${item.id}`)}
    >
      <View style={styles.patientCardTop}>
        <View style={styles.patientInfo}>
          <Text style={[styles.patientName, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.patientAge, { color: colors.muted }]}>
            {item.gestational_age}
          </Text>
        </View>
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: getRiskColor(item.risk_level) + "15" },
          ]}
        >
          <Text
            style={[styles.riskText, { color: getRiskColor(item.risk_level) }]}
          >
            {item.risk_level.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={[styles.patientCardDivider, { borderColor: colors.border }]}
      />

      <View style={styles.patientCardBottom}>
        <View style={styles.statusItem}>
          <MaterialCommunityIcons
            name="calendar-check"
            size={16}
            color={colors.muted}
          />
          <Text style={[styles.statusText, { color: colors.muted }]}>
            Last visit: {new Date(item.last_visit).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.viewButton,
            { backgroundColor: colors.primary + "10" },
          ]}
          onPress={() => router.push(`/patient-detail/${item.id}`)}
        >
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>
            View Details
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name="stethoscope"
            size={28}
            color={colors.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            My Patients
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.push("/symptom-reviews")} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.patientCount, { color: colors.muted }]}>
            {patients.length}
          </Text>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search patients..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {filteredPatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-search"
            size={48}
            color={colors.muted}
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No patients found
          </Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {searchText
              ? "Try a different search"
              : "Add patients to get started"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  patientCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  patientCard: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  patientCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 12,
    fontWeight: "400",
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 11,
    fontWeight: "700",
  },
  patientCardDivider: {
    borderBottomWidth: 1,
    marginVertical: 8,
  },
  patientCardBottom: {
    gap: 10,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "400",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
