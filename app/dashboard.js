import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import {
    appointmentAPI,
    doctorAPI,
    healthAPI,
    predictionAPI,
} from "../services/api";

const { width } = Dimensions.get("window");

const VitalsCard = ({ label, value, unit, colors }) => (
  <View style={[styles.vitalsCard, { backgroundColor: colors.background }]}>
    <Text style={[styles.vitalsLabel, { color: colors.text }]}>{label}</Text>
    <Text style={[styles.vitalsValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.vitalsUnit, { color: colors.text }]}>{unit}</Text>
  </View>
);

const ActionButton = ({
  icon,
  label,
  onPress,
  colors,
  backgroundColor,
  iconColor,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.actionButton,
      { backgroundColor: backgroundColor || colors.card },
    ]}
  >
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={iconColor || colors.primary}
    />
    <Text
      style={[styles.actionButtonLabel, { color: iconColor || colors.primary }]}
      numberOfLines={2}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colors = Colors.light;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const isMother = user?.role?.toLowerCase() === "mother";

      if (isMother) {
        // Load mother dashboard data
        const healthResponse = await healthAPI.getLatestHealth();
        if (healthResponse?.record) {
          setHealthData(healthResponse.record);
        }

        try {
          const predictionResponse = await predictionAPI.getPredictionHistory({
            limit: 1,
          });
          if (
            predictionResponse?.predictions &&
            predictionResponse.predictions.length > 0
          ) {
            setLatestPrediction(predictionResponse.predictions[0]);
          }
        } catch (_e) {
          console.log("Prediction not available");
        }
      } else {
        // Load doctor dashboard data (patients list and appointments)
        try {
          const patientsResponse = await doctorAPI.getPatients({ limit: 50 });
          if (patientsResponse?.patients) {
            setPatients(patientsResponse.patients);
          }
        } catch (error) {
          console.log("Could not load patients:", error);
          setPatients([]);
        }

        // Load doctor appointments
        try {
          const appointmentsResponse =
            await appointmentAPI.getDoctorAppointments({ limit: 100 });
          if (appointmentsResponse?.appointments) {
            setAppointments(appointmentsResponse.appointments);
          }
        } catch (error) {
          console.log("Could not load appointments:", error);
          setAppointments([]);
        }
      }
    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Refresh data when screen is focused (e.g., returning from health-monitoring)
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getPregnancyWeek = () => {
    if (user?.pregnancy_start_date) {
      const startDate = new Date(user.pregnancy_start_date);
      const today = new Date();
      const diffInMs = today.getTime() - startDate.getTime();
      return Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
    }
    return 28;
  };

  const getDueDate = () => {
    if (user?.pregnancy_start_date) {
      const startDate = new Date(user.pregnancy_start_date);
      startDate.setDate(startDate.getDate() + 280);
      return startDate.toISOString().split("T")[0];
    }
    return "2026-06-15";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isMother = user?.role?.toLowerCase() === "mother";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Greeting Header */}
        <View style={styles.greetingHeader}>
          <View>
            <Text style={styles.greetingLabel}>Welcome</Text>
            <Text style={styles.greetingName}>
              {user?.role?.toLowerCase() === "doctor" ? "Dr. " : ""}
              {user?.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              try {
                await logout();
              } catch (error) {
                console.error("Logout error:", error);
              }
            }}
            style={styles.logoutIconButton}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#e63946" />
          </TouchableOpacity>
        </View>

        {isMother ? (
          <>
            {/* Pregnancy Summary Card */}
            <View style={styles.pregnancySummaryCard}>
              <View style={styles.pregnancyCardContent}>
                <Text style={styles.summaryTitle}>Pregnancy Summary</Text>
                <View style={styles.pregnancyWeeksRow}>
                  <Text style={styles.summaryWeeks}>{getPregnancyWeek()}</Text>
                  <Text style={styles.summaryWeeksLabel}>weeks</Text>
                </View>
                <View style={styles.dueDateRow}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.dueDateText}>
                    Due Date: {getDueDate()}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="baby-carriage"
                size={40}
                color="rgba(255, 255, 255, 0.6)"
              />
            </View>

            {/* Latest Vitals Section */}
            <View style={styles.vitalsSection}>
              <Text style={styles.sectionTitle}>Latest Vitals</Text>
              <View style={styles.vitalsGrid}>
                <VitalsCard
                  key="bp"
                  label="BP"
                  value={healthData?.blood_pressure || "118/75"}
                  unit="mmHg"
                  colors={colors}
                />
                <VitalsCard
                  key="hr"
                  label="HR"
                  value={healthData?.heart_rate || "82"}
                  unit="bpm"
                  colors={colors}
                />
                <VitalsCard
                  key="spo2"
                  label="SpO2"
                  value={healthData?.oxygen_saturation || "98"}
                  unit="%"
                  colors={colors}
                />
                <VitalsCard
                  key="sugar"
                  label="Sugar"
                  value={healthData?.blood_sugar || "95"}
                  unit="mg/dL"
                  colors={colors}
                />
                <VitalsCard
                  key="temp"
                  label="Temp"
                  value={healthData?.temperature || "36.6"}
                  unit="°C"
                  colors={colors}
                />
                <VitalsCard
                  key="weight"
                  label="Weight"
                  value={healthData?.weight || "68.5"}
                  unit="kg"
                  colors={colors}
                />
              </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.quickActionsSection}>
              <View style={styles.actionsGrid}>
                <ActionButton
                  icon="heart-pulse"
                  label="Record Health"
                  onPress={() => router.push("/health-monitoring")}
                  colors={colors}
                  backgroundColor="#d4f5d4"
                  iconColor="#28B26B"
                />
                <ActionButton
                  icon="alert-circle"
                  label="Report Symptoms"
                  onPress={() => router.push("/symptom-checker")}
                  colors={colors}
                  backgroundColor="#fff4d6"
                  iconColor="#FFA500"
                />
                <ActionButton
                  icon="robot"
                  label="Talk to AI"
                  onPress={() => router.push("/ai-assistant")}
                  colors={colors}
                  backgroundColor="#e3f2fd"
                  iconColor="#2196F3"
                />
                <ActionButton
                  icon="chat"
                  label="Chat Doctor"
                  onPress={() => router.push("/messages")}
                  colors={colors}
                  backgroundColor="#f3e5f5"
                  iconColor="#9C27B0"
                />
              </View>
            </View>
          </>
        ) : (
          <DoctorDashboard
            user={user}
            patients={patients}
            appointments={appointments}
            router={router}
            colors={colors}
          />
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

// Doctor Dashboard Component
const DoctorDashboard = ({ user, patients, appointments, router, colors }) => {
  const [appointmentFilter, setAppointmentFilter] = useState("upcoming");
  // Calculate statistics from real patient data
  const totalPatients = patients?.length || 0;
  const highRiskPatients =
    patients?.filter((p) => p.risk_level?.toLowerCase() === "high").length || 0;

  // Calculate today's visits (if visit_date exists)
  const today = new Date().toISOString().split("T")[0];
  const todayVisits =
    patients?.filter((p) => {
      const lastVisit = p.last_visit_date?.split("T")[0];
      return lastVisit === today;
    }).length || 0;

  // Calculate average gestational age
  const avgGestAge =
    patients?.length > 0
      ? Math.round(
          patients.reduce((sum, p) => sum + (p.gestational_age || 0), 0) /
            patients.length,
        )
      : 0;

  // Calculate risk distribution
  const riskCounts = {
    low:
      patients?.filter((p) => p.risk_level?.toLowerCase() === "low").length ||
      0,
    medium:
      patients?.filter((p) => p.risk_level?.toLowerCase() === "medium")
        .length || 0,
    high:
      patients?.filter((p) => p.risk_level?.toLowerCase() === "high").length ||
      0,
  };

  // Get critical alerts (high risk patients)
  const criticalPatients =
    patients?.filter((p) => p.risk_level?.toLowerCase() === "high") || [];
  const firstCriticalPatient = criticalPatients[0];

  // Real appointments from backend - filter by upcoming, past, or all
  const now = new Date();
  const categorizedAppointments = {
    upcoming:
      appointments?.filter((a) => {
        try {
          return new Date(a.appointment_date || a.date) >= now;
        } catch {
          return false;
        }
      }) || [],
    past:
      appointments?.filter((a) => {
        try {
          return new Date(a.appointment_date || a.date) < now;
        } catch {
          return false;
        }
      }) || [],
    all: appointments || [],
  };

  const displayedAppointments =
    categorizedAppointments[appointmentFilter] || [];

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: () => "#28B26B",
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForLabels: { fontSize: 12 },
    propsForBackgroundLines: { stroke: "#e0e0e0", strokeWidth: 1 },
  };

  const StatCard = ({ icon, label, value, color = "#000" }) => (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const AppointmentItem = ({ item }) => {
    // Handle flexible field names from API
    const appointmentDate = new Date(
      item.appointment_date || item.date || item.dateTime,
    );
    const time = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const patientName =
      item.patient_name || item.patientName || item.patient_id || "Unknown";
    const reason = item.reason || item.purpose || item.description || "N/A";
    const status = item.status || "Scheduled";
    const statusColor =
      status?.toLowerCase() === "completed"
        ? "#28B26B"
        : status?.toLowerCase() === "cancelled"
          ? "#E63946"
          : "#FFA500";
    const statusBgColor =
      status?.toLowerCase() === "completed"
        ? "#d4f5d4"
        : status?.toLowerCase() === "cancelled"
          ? "#ffe0d0"
          : "#fff4d6";

    return (
      <View style={styles.appointmentItem}>
        <View style={styles.appointmentTimeSection}>
          <Text style={styles.appointmentTime}>{time}</Text>
        </View>
        <View style={styles.appointmentDetailsSection}>
          <Text style={styles.appointmentPatient}>{patientName}</Text>
          <Text style={styles.appointmentReason}>{reason}</Text>
          <View
            style={[
              styles.appointmentStatus,
              {
                backgroundColor: statusBgColor,
              },
            ]}
          >
            <Text
              style={[styles.appointmentStatusText, { color: statusColor }]}
            >
              {status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const PatientItem = ({ item }) => {
    // Format last visit date from API data
    const lastVisitDate = item.last_visit_date
      ? new Date(item.last_visit_date)
      : null;
    const today = new Date();
    let lastVisitText = item.lastVisit || "N/A";

    if (lastVisitDate) {
      const diffTime = Math.abs(today - lastVisitDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      lastVisitText =
        diffWeeks > 0 ? `${diffWeeks} weeks ago` : `${diffDays} days ago`;
    }

    const riskLevel = item.risk_level || item.riskLevel || "Low";

    return (
      <TouchableOpacity
        style={styles.doctorPatientCard}
        onPress={() =>
          router.push({
            pathname: "/patient-details",
            params: { id: item.id },
          })
        }
      >
        <View style={styles.patientAvatarLarge}>
          <Text style={styles.patientInitial}>
            {item.name?.charAt(0) || "P"}
          </Text>
        </View>
        <View style={styles.patientInfoLarge}>
          <Text style={styles.patientNameLarge}>{item.name}</Text>
          <Text style={styles.patientMetaLarge}>{lastVisitText}</Text>
        </View>
        <View
          style={[
            styles.riskBadge,
            {
              backgroundColor:
                riskLevel?.toLowerCase() === "high"
                  ? "#FFE0D0"
                  : riskLevel?.toLowerCase() === "medium"
                    ? "#FFF4D6"
                    : "#D4F5D4",
            },
          ]}
        >
          <Text
            style={[
              styles.riskBadgeText,
              {
                color:
                  riskLevel?.toLowerCase() === "high"
                    ? "#E63946"
                    : riskLevel?.toLowerCase() === "medium"
                      ? "#FFA500"
                      : "#28B26B",
              },
            ]}
          >
            {riskLevel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const CriticalAlert = () => (
    <View style={styles.criticalAlert}>
      <View style={styles.alertHeader}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#E63946" />
        <Text style={styles.alertTitle}>Critical alert</Text>
      </View>
      <Text style={styles.alertMessage}>
        {criticalPatients.length} patient
        {criticalPatients.length !== 1 ? "s need" : " needs"} attention
      </Text>
      {firstCriticalPatient && (
        <TouchableOpacity
          style={styles.alertPatientItem}
          onPress={() =>
            router.push({
              pathname: "/patient-details",
              params: { id: firstCriticalPatient.id },
            })
          }
        >
          <View style={styles.alertPatientAvatar}>
            <Text style={styles.alertPatientInitial}>
              {firstCriticalPatient.name?.charAt(0) || "P"}
            </Text>
          </View>
          <View style={styles.alertPatientInfo}>
            <Text style={styles.alertPatientName}>
              {firstCriticalPatient.name}
            </Text>
            <Text style={styles.alertPatientStatus}>
              {firstCriticalPatient.gestational_age || "N/A"} weeks - High Risk
            </Text>
          </View>
          <View style={styles.alertRiskBadge}>
            <Text style={styles.alertRiskText}>High</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="account-multiple"
          label="total patients"
          value={totalPatients.toString()}
        />
        <StatCard
          icon="alert-circle"
          label="High risk"
          value={highRiskPatients.toString()}
          color="#E63946"
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="calendar-check"
          label="today's visit"
          value={todayVisits.toString()}
          color="#28B26B"
        />
        <StatCard
          icon="baby-face"
          label="Avg. Gest Age"
          value={`${avgGestAge} w`}
        />
      </View>

      {/* Critical Alert Section */}
      <CriticalAlert />

      {/* Appointments Section */}
      <View style={styles.appointmentsSection}>
        <View style={styles.appointmentsSectionHeader}>
          <Text style={styles.appointmentsSectionTitle}>My Appointments</Text>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              appointmentFilter === "upcoming" && styles.filterButtonActive,
            ]}
            onPress={() => setAppointmentFilter("upcoming")}
          >
            <Text
              style={[
                styles.filterButtonText,
                appointmentFilter === "upcoming" &&
                  styles.filterButtonTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              appointmentFilter === "past" && styles.filterButtonActive,
            ]}
            onPress={() => setAppointmentFilter("past")}
          >
            <Text
              style={[
                styles.filterButtonText,
                appointmentFilter === "past" && styles.filterButtonTextActive,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              appointmentFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setAppointmentFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                appointmentFilter === "all" && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>

        {displayedAppointments.length > 0 ? (
          <FlatList
            data={displayedAppointments}
            keyExtractor={(item) => (item.id || Math.random()).toString()}
            renderItem={({ item }) => <AppointmentItem item={item} />}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noAppointmentsContainer}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={40}
              color={colors.muted}
            />
            <Text style={[styles.noAppointmentsText, { color: colors.muted }]}>
              No {appointmentFilter} appointments
            </Text>
          </View>
        )}
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Weekly Visits Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={20}
              color="#28B26B"
            />
            <Text style={styles.chartTitle}>Weekly Visits</Text>
          </View>
          <LineChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ data: [5, 4, 6, 3, 7, 4, 2] }],
            }}
            width={300}
            height={180}
            chartConfig={{
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              color: () => "#28B26B",
              strokeWidth: 3,
              barPercentage: 0.7,
              decimalPlaces: 0,
              propsForLabels: { fontSize: 11 },
              propsForBackgroundLines: {
                stroke: "#e0e0e0",
                strokeWidth: 1,
              },
            }}
            style={styles.chart}
            withInnerLines={false}
            withHorizontalLabels={false}
          />
        </View>

        {/* Risk Levels Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#28B26B"
            />
            <Text style={styles.chartTitle}>Risk Levels</Text>
          </View>
          <View style={styles.pieChartContainer}>
            <View style={styles.donutChart}>
              <View
                style={[
                  styles.donutSegment,
                  {
                    borderTopColor: "#28B26B",
                    transform: [{ rotate: "0deg" }],
                  },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  {
                    borderTopColor: "#FFA500",
                    transform: [{ rotate: "162deg" }],
                  },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  {
                    borderTopColor: "#E63946",
                    transform: [{ rotate: "270deg" }],
                  },
                ]}
              />
              <View style={styles.donutCenter} />
            </View>
            <View style={styles.riskLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#28B26B" }]}
                />
                <Text style={styles.legendText}>Low</Text>
                <Text style={styles.legendValue}>{riskCounts.low}</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FFA500" }]}
                />
                <Text style={styles.legendText}>Medium</Text>
                <Text style={styles.legendValue}>{riskCounts.medium}</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#E63946" }]}
                />
                <Text style={styles.legendText}>High</Text>
                <Text style={styles.legendValue}>{riskCounts.high}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* My Patients Section */}
      <View style={styles.myPatientsSection}>
        <Text style={styles.myPatientsSectionTitle}>My Patients</Text>
        <Text style={styles.myPatientsSubtitle}>
          {totalPatients} active patient{totalPatients !== 1 ? "s" : ""}
        </Text>
        {patients && patients.length > 0 ? (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <PatientItem item={item} />}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noPatients}>No patients found</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, paddingBottom: 80 },
  welcomeText: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },

  pregnancySummaryCard: {
    backgroundColor: "#28B26B",
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pregnancyCardContent: {
    flex: 1,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pregnancyWeeksRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  summaryWeeks: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  summaryWeeksLabel: { color: "#fff", fontSize: 14, marginLeft: 4 },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateText: { color: "#fff", fontSize: 12, marginLeft: 4 },

  vitalsSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  vitalsCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    width: (width - 48) / 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  vitalsLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
  vitalsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 2,
  },
  vitalsUnit: { fontSize: 10, color: "#999" },

  quickActionsSection: {
    marginVertical: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    width: (width - 48) / 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonLabel: {
    marginTop: 8,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 12,
  },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },

  patientCard: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientName: { fontSize: 16, fontWeight: "600" },

  // Doctor Dashboard Styles
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
  },

  criticalAlert: {
    backgroundColor: "#FFE0D0",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E63946",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E63946",
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  alertPatientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  alertPatientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E63946",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertPatientInitial: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  alertPatientInfo: {
    flex: 1,
  },
  alertPatientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  alertPatientStatus: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  alertRiskBadge: {
    backgroundColor: "#FFE0D0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertRiskText: {
    color: "#E63946",
    fontSize: 12,
    fontWeight: "bold",
  },

  appointmentsSection: {
    marginVertical: 12,
  },
  appointmentsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  appointmentsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  filterButtonActive: {
    backgroundColor: "#28B26B",
    borderColor: "#28B26B",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  noAppointmentsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  noAppointmentsText: {
    fontSize: 14,
    marginTop: 10,
  },
  viewAllLink: {
    fontSize: 14,
    color: "#28B26B",
    fontWeight: "600",
  },
  appointmentItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentTimeSection: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  appointmentDetailsSection: {
    flex: 1,
    padding: 12,
  },
  appointmentPatient: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  appointmentReason: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  appointmentStatus: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  myPatientsSection: {
    marginTop: 12,
  },
  myPatientsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  myPatientsSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  doctorPatientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#28B26B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patientInitial: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  patientInfoLarge: {
    flex: 1,
  },
  patientNameLarge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  patientMetaLarge: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  // Chart Styles
  chartsContainer: {
    marginHorizontal: 12,
    marginVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#000",
  },
  chart: {
    marginLeft: -10,
    marginRight: -10,
  },
  pieChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  donutChart: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 12,
    borderColor: "#28B26B",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  donutSegment: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 12,
    position: "absolute",
  },
  donutCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  riskLegend: {
    marginTop: 8,
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    marginLeft: "auto",
  },
  noPatients: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  greetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  greetingLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  logoutIconButton: {
    padding: 8,
  },
});
