import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

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

// Design tokens (shared with the HTML design)
const C = {
  teal900: "#17493f",
  teal700: "#1f5f53",
  teal600: "#2c7263",
  teal500: "#2f7a6a",
  teal100: "#d6e8e2",
  cream: "#f3efe6",
  page: "#ece7dc",
  ink: "#1c2b27",
  muted: "#5d6b66",
  alertBg: "#f5e7e0",
  alert: "#a3402e",
  pink: "#f7dcdc",
  pinkInk: "#c0504d",
  line: "#c6cfca",
};
const HERO_H = 340;

/* ---------- Curved teal header with contour lines ---------- */
const HeroBackground = () => {
  const w = width;
  return (
    <View style={styles.hero} pointerEvents="none">
      <Svg width={w} height={HERO_H} viewBox={`0 0 ${w} ${HERO_H}`}>
        <Defs>
          <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.teal600} />
            <Stop offset="1" stopColor="#1d5a4e" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M0 0H${w}V${HERO_H - 60}Q${w / 2} ${HERO_H + 10} 0 ${HERO_H - 60}Z`}
          fill="url(#heroGrad)"
        />
        {[90, 140, 200].map((y, i) => (
          <Path
            key={i}
            d={`M-10 ${y} C${w * 0.2} ${y - 50} ${w * 0.4} ${y + 50} ${w * 0.65} ${y - 10} S${w * 0.95} ${y - 60} ${w + 10} ${y - 20}`}
            stroke="#ffffff"
            strokeOpacity={0.14}
            strokeWidth={1}
            fill="none"
          />
        ))}
        <Path
          d={`M${w * 0.3} -10 C${w * 0.38} 60 ${w * 0.28} 120 ${w * 0.38} 200 S${w * 0.5} 290 ${w * 0.46} 340`}
          stroke="#ffffff"
          strokeOpacity={0.14}
          strokeWidth={1}
          fill="none"
        />
      </Svg>
    </View>
  );
};

/* ---------- Mother dashboard pieces ---------- */
const VitalsCard = ({ label, value, unit, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.vitalsCard}>
    <Text style={styles.vitalsLabel}>{label}</Text>
    <Text style={styles.vitalsValue}>{value}</Text>
    <Text style={styles.vitalsUnit}>{unit}</Text>
  </TouchableOpacity>
);

const ActionButton = ({ icon, label, onPress, backgroundColor, iconColor }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.actionButton, { backgroundColor: backgroundColor || C.cream }]}
  >
    <MaterialCommunityIcons name={icon} size={24} color={iconColor || C.teal700} />
    <Text style={[styles.actionButtonLabel, { color: iconColor || C.teal700 }]} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
      const role = String(user?.role || "").trim().toLowerCase();

      if (role === "mother") {
        const healthResponse = await healthAPI.getLatestHealth();
        if (healthResponse?.record) setHealthData(healthResponse.record);

        try {
          const predictionResponse = await predictionAPI.getPredictionHistory({ limit: 1 });
          if (predictionResponse?.predictions?.length > 0) {
            setLatestPrediction(predictionResponse.predictions[0]);
          }
        } catch (_e) {
          console.log("Prediction not available");
        }
      } else {
        try {
          const patientsResponse = await doctorAPI.getPatients({ limit: 50 });
          if (patientsResponse?.patients) setPatients(patientsResponse.patients);
        } catch (error) {
          console.log("Could not load patients:", error);
          setPatients([]);
        }

        try {
          const appointmentsResponse = await appointmentAPI.getDoctorAppointments({ limit: 100 });
          if (appointmentsResponse?.appointments) setAppointments(appointmentsResponse.appointments);
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

  // Refresh when the screen regains focus (e.g. returning from health-monitoring)
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getPregnancyWeek = () =>
    healthData?.gestational_age ?? user?.pregnancyProfile?.gestational_age ?? "Not set";
  const getDueDate = () => healthData?.due_date || user?.pregnancyProfile?.due_date || "Not set";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const normalizedRole = String(user?.role || "").trim().toLowerCase();
  const isMother = normalizedRole === "mother";
  const isDoctor = normalizedRole === "doctor";
  const onHero = !isMother; // doctor view sits on the teal header

  if (!isMother && !isDoctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {onHero && <HeroBackground />}

        <View style={styles.pad}>
          {/* Greeting Header */}
          <View style={styles.greetingHeader}>
            <View>
              <Text style={[styles.greetingLabel, onHero && styles.onHeroLabel]}>
                {isDoctor ? "Good afternoon" : "Welcome"}
              </Text>
              <Text style={[styles.greetingName, onHero && styles.onHeroName]}>
                {isDoctor ? "Dr. " : ""}
                {user?.name}
                {isDoctor ? " 👋" : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={[styles.profileAvatar, onHero && styles.profileAvatarHero]}
            >
              <MaterialCommunityIcons name="account" size={onHero ? 28 : 22} color={C.teal700} />
            </TouchableOpacity>
          </View>

          {isMother ? (
            <>
              {/* Pregnancy Summary Card */}
              <View style={styles.pregnancySummaryCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle}>Pregnancy Summary</Text>
                  <View style={styles.pregnancyWeeksRow}>
                    <Text style={styles.summaryWeeks}>{getPregnancyWeek()}</Text>
                    <Text style={styles.summaryWeeksLabel}>weeks</Text>
                  </View>
                  <View style={styles.dueDateRow}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#fff" />
                    <Text style={styles.dueDateText}>Due Date: {getDueDate()}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="baby-carriage" size={40} color="rgba(255,255,255,0.6)" />
              </View>

              {/* Latest Vitals Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Latest Vitals</Text>
                <View style={styles.vitalsGrid}>
                  {[
                    ["bp", "BP", healthData?.blood_pressure, "mmHg"],
                    ["hr", "HR", healthData?.heart_rate, "bpm"],
                    ["spo2", "SpO2", healthData?.oxygen_level, "%"],
                    ["sugar", "Sugar", healthData?.blood_sugar, "mg/dL"],
                    ["temp", "Temp", healthData?.temperature, "°C"],
                    ["weight", "Weight", healthData?.weight, "kg"],
                  ].map(([key, label, value, unit]) => (
                    <VitalsCard
                      key={key}
                      label={label}
                      value={value || "Not recorded"}
                      unit={unit}
                      onPress={() => router.push("/health-monitoring")}
                    />
                  ))}
                </View>
              </View>

              {/* Quick Actions Section */}
              <View style={styles.actionsGrid}>
                <ActionButton
                  icon="heart-pulse"
                  label="Record Health"
                  onPress={() => router.push("/health-monitoring")}
                  backgroundColor={C.teal900}
                  iconColor="#ffffff"
                />
                <ActionButton
                  icon="alert-circle"
                  label="Report Symptoms"
                  onPress={() => router.push("/symptom-checker")}
                  backgroundColor="#fff4d6"
                  iconColor="#FFA500"
                />
                <ActionButton
                  icon="robot"
                  label="Talk to AI"
                  onPress={() => router.push("/ai-assistant")}
                  backgroundColor="#e3f2fd"
                  iconColor="#2196F3"
                />
                <ActionButton
                  icon="chat"
                  label="Chat Doctor"
                  onPress={() => router.push("/messages")}
                  backgroundColor="#f3e5f5"
                  iconColor="#9C27B0"
                />
              </View>
            </>
          ) : isDoctor ? (
            <DoctorDashboard patients={patients} appointments={appointments} router={router} />
          ) : null}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

/* ---------- Doctor Dashboard ---------- */
const DoctorDashboard = ({ patients, appointments, router }) => {
  const [appointmentFilter, setAppointmentFilter] = useState("upcoming");
  const risk = (p) => String(p.risk_level || "").toLowerCase();

  const totalPatients = patients?.length || 0;
  const highRiskPatients = patients?.filter((p) => risk(p) === "high").length || 0;
  const today = new Date().toISOString().split("T")[0];
  const todayVisits = patients?.filter((p) => p.last_visit_date?.split("T")[0] === today).length || 0;
  const avgGestAge =
    patients?.length > 0
      ? Math.round(patients.reduce((sum, p) => sum + Number(p.gestational_age || 0), 0) / patients.length)
      : 0;
  const riskCounts = {
    low: patients?.filter((p) => risk(p) === "low").length || 0,
    medium: patients?.filter((p) => risk(p) === "medium").length || 0,
    high: highRiskPatients,
  };
  const criticalPatients = patients?.filter((p) => risk(p) === "high") || [];

  const now = new Date();
  const getAppointmentDate = (item) => new Date(item.appointment_date || item.date || item.dateTime);
  const categorizedAppointments = {
    upcoming: appointments?.filter((item) => getAppointmentDate(item) >= now) || [],
    past: appointments?.filter((item) => getAppointmentDate(item) < now) || [],
    all: appointments || [],
  };
  const displayedAppointments = categorizedAppointments[appointmentFilter] || [];

  const StatCard = ({ icon, label, value, dark }) => (
    <View style={[styles.statCard, dark && styles.statCardDark]}>
      <MaterialCommunityIcons name={icon} size={22} color={dark ? "#cfe6df" : C.teal500} />
      <View>
        <Text style={[styles.statValue, dark && { color: "#fff" }]}>{value}</Text>
        <Text style={[styles.statLabel, dark && { color: "#cfe6df" }]}>{label}</Text>
      </View>
    </View>
  );

  const AppointmentItem = ({ item }) => {
    const appointmentDate = getAppointmentDate(item);
    const time = appointmentDate
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      .toLowerCase();
    const patientName =
      item.patient_name || item.patientName || item.patient_id || item.users?.name || "Unknown Patient";
    const reason = item.reason || item.purpose || item.description || "Appointment";
    const status = item.status || "Scheduled";
    const s = String(status).toLowerCase();
    const cancelled = s === "cancelled";
    const statusColor = s === "completed" ? C.teal700 : cancelled ? "#e63946" : "#b77900";
    const statusBg = s === "completed" ? "#dff4eb" : cancelled ? "#ffe4e1" : "#fff1cf";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.apptCard}
        onPress={() => router.push({ pathname: "/appointments", params: { id: item.id } })}
      >
        <View style={[styles.apptPic, cancelled && { backgroundColor: C.pink }]}>
          <MaterialCommunityIcons name="account-outline" size={22} color={cancelled ? C.pinkInk : C.teal500} />
        </View>
        <View style={styles.apptBody}>
          <Text style={styles.apptName} numberOfLines={1}>{patientName}</Text>
          <Text style={styles.apptSub} numberOfLines={1}>{reason}</Text>
          <View style={styles.apptTimeRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={C.muted} />
            <Text style={styles.apptTime}>Time • {time}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
        <View style={[styles.apptTag, cancelled && { backgroundColor: C.pink }]}>
          <MaterialCommunityIcons
            name={cancelled ? "calendar-remove" : "calendar-check"}
            size={16}
            color={cancelled ? C.pinkInk : C.teal500}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const PatientItem = ({ item }) => {
    const lastVisitDate = item.last_visit_date ? new Date(item.last_visit_date) : null;
    const diffDays =
      lastVisitDate && !Number.isNaN(lastVisitDate.getTime())
        ? Math.ceil(Math.abs(new Date() - lastVisitDate) / (1000 * 60 * 60 * 24))
        : null;
    const lastVisitText =
      item.lastVisit ||
      (diffDays !== null
        ? Math.floor(diffDays / 7) > 0
          ? `${Math.floor(diffDays / 7)} weeks ago`
          : `${diffDays} days ago`
        : "N/A");
    const riskLevel = item.risk_level || item.riskLevel || "Low";
    const r = String(riskLevel).toLowerCase();
    return (
      <TouchableOpacity
        style={styles.patientCard}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: "/patient-details", params: { id: item.id } })}
      >
        <View style={styles.patientAvatar}>
          <Text style={styles.patientInitial}>{item.name?.charAt(0)?.toUpperCase() || "P"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{item.name || "Unknown Patient"}</Text>
          <Text style={styles.patientMeta}>{lastVisitText}</Text>
        </View>
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: r === "high" ? "#ffe1df" : r === "medium" ? "#fff0d0" : "#dff4eb" },
          ]}
        >
          <Text
            style={[
              styles.riskBadgeText,
              { color: r === "high" ? "#e63946" : r === "medium" ? "#b77900" : C.teal700 },
            ]}
          >
            {riskLevel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard icon="account-multiple-outline" label="Total Patients" value={totalPatients} dark />
        <StatCard icon="alert-outline" label="High Risk" value={highRiskPatients} />
        <StatCard icon="calendar-check-outline" label="Today's Visits" value={todayVisits} />
        <StatCard icon="baby-face-outline" label="Avg. Gest Age" value={`${avgGestAge}w`} />
      </View>

      {/* Critical alert */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.criticalAlert}
        onPress={() =>
          criticalPatients[0] &&
          router.push({ pathname: "/patient-details", params: { id: criticalPatients[0].id } })
        }
      >
        <Text style={styles.criticalTitle}>Critical Alert</Text>
        <Text style={styles.criticalMessage}>
          {criticalPatients.length > 0
            ? `${criticalPatients.length} new critical patient ${criticalPatients.length === 1 ? "update" : "updates"}`
            : "No new critical patient updates"}
        </Text>
        {criticalPatients.length > 0 && <View style={styles.criticalDot} />}
      </TouchableOpacity>

      {/* Appointments */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Appointments</Text>
        <TouchableOpacity onPress={() => router.push("/appointments")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[["upcoming", "Upcoming"], ["past", "Past"], ["all", "All"]].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            onPress={() => setAppointmentFilter(value)}
            style={[styles.tab, appointmentFilter === value && styles.tabActive]}
          >
            <Text style={[styles.tabText, appointmentFilter === value && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayedAppointments.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={displayedAppointments}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={({ item }) => <AppointmentItem item={item} />}
          style={styles.apptList}
          contentContainerStyle={styles.apptListContent}
        />
      ) : (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={34} color="#a3aaa7" />
          <Text style={styles.emptyText}>No {appointmentFilter} appointments</Text>
        </View>
      )}

      {/* Charts */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <MaterialCommunityIcons name="chart-line" size={18} color={C.teal700} />
          <Text style={styles.chartTitle}>Weekly Visits</Text>
        </View>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: [5, 4, 6, 3, 7, 4, 2] }],
          }}
          width={Math.max(width - 64, 230)}
          height={170}
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            color: () => C.teal700,
            strokeWidth: 3,
            decimalPlaces: 0,
            propsForLabels: { fontSize: 10, fill: "#89938f" },
            propsForBackgroundLines: { stroke: "#edf0ee", strokeWidth: 1 },
          }}
          style={styles.chart}
          withDots={Platform.OS !== "web"}
          withInnerLines
          withHorizontalLabels
          bezier
        />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <MaterialCommunityIcons name="chart-donut" size={18} color={C.teal700} />
          <Text style={styles.chartTitle}>Risk Levels</Text>
        </View>
        <View style={styles.riskContainer}>
          <View style={styles.donut}>
            <View style={styles.donutInner}>
              <Text style={styles.donutNumber}>{totalPatients}</Text>
              <Text style={styles.donutLabel}>Patients</Text>
            </View>
          </View>
          <View style={styles.riskLegend}>
            {[
              [C.teal700, "Low", riskCounts.low],
              ["#f5a623", "Medium", riskCounts.medium],
              ["#e63946", "High", riskCounts.high],
            ].map(([color, label, value]) => (
              <View style={styles.legendRow} key={label}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
                <Text style={styles.legendValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Recent patients */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Patients</Text>
        <TouchableOpacity onPress={() => router.push("/patients")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>
      {patients?.length > 0 ? (
        <FlatList
          data={patients}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={({ item }) => <PatientItem item={item} />}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.noPatients}>No patients found</Text>
      )}
    </View>
  );
};

const shadow = {
  shadowColor: "#143229",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.page },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  pad: { paddingHorizontal: 18 },
  hero: { position: "absolute", top: 0, left: 0, right: 0, height: HERO_H },

  /* Greeting */
  greetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 22,
    marginHorizontal: 4,
  },
  greetingLabel: { fontSize: 13, color: C.muted, marginBottom: 2 },
  greetingName: { fontSize: 24, fontWeight: "700", color: C.ink },
  onHeroLabel: { color: "rgba(255,255,255,0.9)" },
  onHeroName: { color: "#ffffff" },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    ...shadow,
  },
  profileAvatarHero: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: "#ffffff",
    backgroundColor: "#d9b799",
  },

  /* Section headings */
  section: { marginVertical: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 22,
    marginBottom: 12,
    marginHorizontal: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: C.ink },
  viewAll: { fontSize: 13, color: C.teal500 },

  /* Mother dashboard */
  pregnancySummaryCard: {
    backgroundColor: C.teal900,
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...shadow,
  },
  summaryTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  pregnancyWeeksRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  summaryWeeks: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  summaryWeeksLabel: { color: "#fff", fontSize: 14, marginLeft: 4 },
  dueDateRow: { flexDirection: "row", alignItems: "center" },
  dueDateText: { color: "#fff", fontSize: 12, marginLeft: 4 },
  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  vitalsCard: {
    backgroundColor: C.cream,
    padding: 12,
    borderRadius: 14,
    width: (width - 36 - 16) / 3,
    alignItems: "center",
    ...shadow,
  },
  vitalsLabel: { fontSize: 11, color: C.muted, marginBottom: 4 },
  vitalsValue: { fontSize: 18, fontWeight: "bold", color: C.ink, marginVertical: 2, textAlign: "center" },
  vitalsUnit: { fontSize: 10, color: C.muted },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginVertical: 16 },
  actionButton: {
    width: (width - 36 - 12) / 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  actionButtonLabel: { marginTop: 8, fontWeight: "600", textAlign: "center", fontSize: 12 },

  /* Doctor: stat cards */
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  statCard: {
    width: (width - 36 - 12) / 2,
    height: 100,
    backgroundColor: C.cream,
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
    ...shadow,
  },
  statCardDark: { backgroundColor: C.teal900 },
  statValue: { fontSize: 26, fontWeight: "700", color: C.ink, lineHeight: 28 },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 4 },

  /* Doctor: critical alert */
  criticalAlert: {
    marginTop: 18,
    backgroundColor: C.alertBg,
    borderLeftWidth: 4,
    borderLeftColor: C.alert,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...shadow,
  },
  criticalTitle: { fontSize: 15, fontWeight: "700", color: C.alert },
  criticalMessage: { fontSize: 13, color: "#4a3a35", marginTop: 3 },
  criticalDot: { position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: "#d23b2e" },

  /* Doctor: appointment tabs + cards */
  tabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
  },
  tabActive: { backgroundColor: C.teal700, borderColor: C.teal700 },
  tabText: { fontSize: 13, color: C.muted },
  tabTextActive: { color: "#ffffff" },
  apptList: { marginHorizontal: -18 },
  apptListContent: { paddingHorizontal: 18, paddingBottom: 8, gap: 12 },
  apptCard: {
    width: 270,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    ...shadow,
  },
  apptPic: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.teal100,
    alignItems: "center",
    justifyContent: "center",
  },
  apptBody: { flex: 1, marginHorizontal: 10 },
  apptName: { fontSize: 14, fontWeight: "700", color: C.ink },
  apptSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  apptTimeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  apptTime: { fontSize: 12, color: C.muted },
  apptTag: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.teal100,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  emptyBox: { backgroundColor: "#ffffff", borderRadius: 16, minHeight: 105, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 12, color: "#929b97", marginTop: 7 },

  /* Doctor: charts */
  chartCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 14, marginTop: 14, ...shadow },
  chartHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: C.ink, marginLeft: 6 },
  chart: { marginLeft: -12, marginRight: -12, marginTop: 2 },
  riskContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 10 },
  donut: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 12,
    borderTopColor: C.teal700,
    borderRightColor: "#f5a623",
    borderBottomColor: "#e63946",
    borderLeftColor: C.teal700,
    justifyContent: "center",
    alignItems: "center",
  },
  donutInner: { width: 61, height: 61, borderRadius: 31, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  donutNumber: { fontSize: 16, fontWeight: "800", color: C.ink },
  donutLabel: { fontSize: 8, color: "#89938f", marginTop: 1 },
  riskLegend: { marginLeft: 8, minWidth: 110 },
  legendRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: C.muted, flex: 1 },
  legendValue: { fontSize: 12, color: C.ink, fontWeight: "700" },

  /* Doctor: patients */
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    ...shadow,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.teal700,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patientInitial: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  patientName: { fontSize: 14, fontWeight: "600", color: C.ink },
  patientMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  riskBadgeText: { fontSize: 11, fontWeight: "bold" },
  noPatients: { fontSize: 14, color: "#999", textAlign: "center", padding: 20 },
});