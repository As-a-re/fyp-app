import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";
import { healthAPI } from "../services/api";

const { width } = Dimensions.get("window");

const HealthForm = ({
  colors,
  onClose,
  onSave,
  saving,
  setBloodPressure,
  setBloodSugar,
  setHeartRate,
  setOxygenLevel,
  setTemperature,
  setWeight,
  bloodPressure,
  bloodSugar,
  heartRate,
  oxygenLevel,
  temperature,
  weight,
}) => (
  <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
    <View style={styles.formHeader}>
      <Text style={[styles.formTitle, { color: colors.text }]}>
        Record Health
      </Text>
      <TouchableOpacity onPress={onClose}>
        <Text style={{ color: colors.primary }}>Close</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.inputRow}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background }]}
        placeholder="Blood Pressure (120/80)"
        value={bloodPressure}
        onChangeText={setBloodPressure}
        keyboardType="numbers-and-punctuation"
        placeholderTextColor={colors.textSecondary}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.background }]}
        placeholder="Blood Sugar (95)"
        value={bloodSugar}
        onChangeText={setBloodSugar}
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <View style={styles.inputRow}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background }]}
        placeholder="Heart Rate (80)"
        value={heartRate}
        onChangeText={setHeartRate}
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.background }]}
        placeholder="Temperature (36.6)"
        value={temperature}
        onChangeText={setTemperature}
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <View style={styles.inputRow}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background }]}
        placeholder="Weight (68)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.background }]}
        placeholder="Oxygen Level (98)"
        value={oxygenLevel}
        onChangeText={setOxygenLevel}
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />
    </View>

    <TouchableOpacity
      style={[styles.saveButton, { backgroundColor: colors.primary }]}
      onPress={onSave}
      disabled={saving}
    >
      {saving ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.saveButtonText}>Submit</Text>
      )}
    </TouchableOpacity>
  </View>
);

export default function HealthMonitoringScreen() {
  const colors = Colors.light;

  const [bloodPressure, setBloodPressure] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [oxygenLevel, setOxygenLevel] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");

  const [formActive, setFormActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHealthHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await healthAPI.getHealthHistory({ limit: 20 });
      setHistory(response?.records || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load health history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadHealthHistory();
  }, [loadHealthHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHealthHistory();
  }, [loadHealthHistory]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};

      // Add blood pressure if provided - must be in format XX/XX
      if (bloodPressure.trim()) {
        const bpRegex = /^\d{2,3}\/\d{2,3}$/;
        if (!bpRegex.test(bloodPressure)) {
          Alert.alert("Error", "Blood pressure must be in format 120/80");
          setSaving(false);
          return;
        }
        payload.blood_pressure = bloodPressure;
      }

      // Add blood sugar if provided (parse as float)
      if (bloodSugar.trim()) {
        const bsValue = parseFloat(bloodSugar);
        if (isNaN(bsValue) || bsValue < 0 || bsValue > 500) {
          Alert.alert("Error", "Blood sugar must be between 0-500 mg/dL");
          setSaving(false);
          return;
        }
        payload.blood_sugar = bsValue;
      }

      // Add heart rate if provided (parse as int)
      if (heartRate.trim()) {
        const hrValue = parseInt(heartRate, 10);
        if (isNaN(hrValue) || hrValue < 40 || hrValue > 200) {
          Alert.alert("Error", "Heart rate must be between 40-200 bpm");
          setSaving(false);
          return;
        }
        payload.heart_rate = hrValue;
      }

      // Add temperature if provided (parse as float)
      if (temperature.trim()) {
        const tempValue = parseFloat(temperature);
        if (isNaN(tempValue) || tempValue < 95 || tempValue > 105) {
          Alert.alert("Error", "Temperature must be between 95-105°F");
          setSaving(false);
          return;
        }
        payload.temperature = tempValue;
      }

      // Add weight if provided (parse as float)
      if (weight.trim()) {
        const weightValue = parseFloat(weight);
        if (isNaN(weightValue) || weightValue < 50 || weightValue > 500) {
          Alert.alert("Error", "Weight must be between 50-500 lbs");
          setSaving(false);
          return;
        }
        payload.weight = weightValue;
      }

      // Add oxygen level if provided (parse as int)
      if (oxygenLevel.trim()) {
        const o2Value = parseInt(oxygenLevel, 10);
        if (isNaN(o2Value) || o2Value < 70 || o2Value > 100) {
          Alert.alert("Error", "Oxygen level must be between 70-100%");
          setSaving(false);
          return;
        }
        payload.oxygen_level = o2Value;
      }

      if (Object.keys(payload).length === 0) {
        Alert.alert("Error", "Please fill in at least one field");
        setSaving(false);
        return;
      }

      console.log("Submitting health data:", payload);
      const response = await healthAPI.addHealthRecord(payload);
      console.log("Health record response:", response);

      Alert.alert("Success", "Health data recorded successfully!");
      setFormActive(false);
      // Clear form fields
      setBloodPressure("");
      setBloodSugar("");
      setHeartRate("");
      setOxygenLevel("");
      setTemperature("");
      setWeight("");

      // Refresh the history after a short delay to ensure the record is saved
      setTimeout(() => {
        loadHealthHistory();
      }, 500);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save health data.");
    } finally {
      setSaving(false);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <View style={[styles.historyItem, { backgroundColor: colors.card }]}>
      <View>
        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
          {new Date(item.created_at).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </Text>
        <Text style={[styles.historyVitals, { color: colors.text }]}>
          BP: {item.blood_pressure} • HR: {item.heart_rate}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.historyVitals, { color: colors.text }]}>
          SpO2: {item.oxygen_level}%
        </Text>
        <Text style={[styles.historyVitals, { color: colors.text }]}>
          {item.weight} kg
        </Text>
      </View>
    </View>
  );

  const getChartData = () => {
    const labels = history
      .map((item) =>
        new Date(item.created_at).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
        }),
      )
      .reverse();

    const bpSystolic = history
      .map((item) => parseInt(item.blood_pressure.split("/")[0], 10))
      .reverse();
    const bpDiastolic = history
      .map((item) => parseInt(item.blood_pressure.split("/")[1], 10))
      .reverse();

    return {
      labels: labels.slice(0, 5), // Limit to last 5 for readability
      datasets: [
        {
          data: bpSystolic.slice(0, 5),
          color: (opacity = 1) => `rgba(40, 178, 107, ${opacity})`, // Green
          strokeWidth: 2,
        },
        {
          data: bpDiastolic.slice(0, 5),
          color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`, // Light grey
          strokeWidth: 2,
        },
      ],
    };
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Health</Text>

          {!formActive && (
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: colors.primary }]}
              onPress={() => setFormActive(true)}
            >
              <Text style={styles.recordButtonText}>+ Record Health</Text>
            </TouchableOpacity>
          )}
        </View>

        {formActive && (
          <HealthForm
            colors={colors}
            onClose={() => setFormActive(false)}
            onSave={handleSave}
            saving={saving}
            {...{
              setBloodPressure,
              setBloodSugar,
              setHeartRate,
              setOxygenLevel,
              setTemperature,
              setWeight,
              bloodPressure,
              bloodSugar,
              heartRate,
              oxygenLevel,
              temperature,
              weight,
            }}
          />
        )}

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            <View
              style={[styles.chartContainer, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Blood Pressure & Heart Rate
              </Text>
              {history.length > 1 ? (
                <LineChart
                  data={getChartData()}
                  width={width - 60}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(150, 150, 150, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              ) : (
                <Text
                  style={{
                    color: colors.textSecondary,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  Not enough data to display chart. Please record at least two
                  entries.
                </Text>
              )}
            </View>

            <Text style={[styles.historyTitle, { color: colors.text }]}>
              History
            </Text>
            <FlatList
              data={history}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text
                  style={{
                    color: colors.textSecondary,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  No health records found.
                </Text>
              }
            />
          </>
        )}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  recordButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  recordButtonText: { color: "#fff", fontWeight: "600" },
  formContainer: {
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  formTitle: { fontSize: 18, fontWeight: "bold" },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  saveButton: {
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  chartContainer: {
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  historyDate: { fontSize: 12, marginBottom: 5 },
  historyVitals: { fontSize: 14, fontWeight: "500" },
});
