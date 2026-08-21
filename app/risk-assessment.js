import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { predictionAPI } from "../services/api";

export default function RiskAssessmentScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const riskFactors = [
    { icon: "account-clock", label: "Advanced Age", value: "No" },
    { icon: "heart", label: "Hypertension", value: "No" },
    { icon: "water", label: "Diabetes", value: "No" },
    { icon: "lungs", label: "Respiratory Issues", value: "No" },
    { icon: "pill", label: "Previous Complications", value: "No" },
    { icon: "dna", label: "Genetic Factors", value: "No" },
  ];

  const handleRunAssessment = async () => {
    setLoading(true);
    try {
      // Call backend API for risk assessment
      const response = await predictionAPI.predictRisk({});

      if (response.prediction) {
        setAssessment({
          risk_level: response.prediction.risk_level || "low",
          risk_score: response.prediction.risk_score || 0.25,
          recommendations: response.prediction.recommendations || [
            "Continue prenatal care as scheduled",
            "Maintain healthy diet and exercise",
            "Report any concerning symptoms immediately",
          ],
        });
      }
    } catch (error) {
      console.error("Risk assessment error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to run risk assessment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const levelStr = level?.toLowerCase() || "low";
    if (levelStr === "high") return "#dc2626";
    if (levelStr === "medium") return "#ffa500";
    return colors.primary;
  };

  const getRiskIcon = (level) => {
    const levelStr = level?.toLowerCase() || "low";
    if (levelStr === "high") return "alert-circle";
    if (levelStr === "medium") return "alert";
    return "check-circle";
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Risk Assessment
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Assessment Button */}
        <TouchableOpacity
          style={[styles.assessButton, { backgroundColor: colors.primary }]}
          onPress={handleRunAssessment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="stethoscope"
                size={18}
                color="#fff"
              />
              <Text style={styles.assessButtonText}>
                {assessment ? "Run New Assessment" : "Run Assessment"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {assessment && (
          <>
            {/* Result Card */}
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderLeftColor: getRiskColor(assessment.risk_level),
                },
              ]}
            >
              <View style={styles.resultHeader}>
                <View
                  style={[
                    styles.resultIcon,
                    {
                      backgroundColor:
                        getRiskColor(assessment.risk_level) + "15",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getRiskIcon(assessment.risk_level)}
                    size={28}
                    color={getRiskColor(assessment.risk_level)}
                  />
                </View>
                <View style={styles.resultInfo}>
                  <Text
                    style={[
                      styles.resultLevel,
                      { color: getRiskColor(assessment.risk_level) },
                    ]}
                  >
                    {assessment.risk_level.toUpperCase()}
                  </Text>
                  <Text style={[styles.resultScore, { color: colors.muted }]}>
                    Risk Score: {(assessment.risk_score * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Recommendations */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Recommendations
              </Text>
              {assessment.recommendations?.map((rec, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.recItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.recText, { color: colors.foreground }]}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Risk Factors Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Risk Factors
          </Text>
          <View style={styles.factorsGrid}>
            {riskFactors.map((factor, idx) => (
              <View
                key={idx}
                style={[
                  styles.factorCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.factorIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={factor.icon}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text
                  style={[styles.factorLabel, { color: colors.foreground }]}
                >
                  {factor.label}
                </Text>
                <Text style={[styles.factorValue, { color: colors.muted }]}>
                  {factor.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
            style={{ marginBottom: 8 }}
          />
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            About This Assessment
          </Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            This assessment tool provides an estimated risk level based on your
            health data. It should not replace professional medical advice.
            Always consult with your doctor for proper diagnosis and treatment.
          </Text>
        </View>

        {/* Risk Levels Guide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Risk Levels Guide
          </Text>
          {[
            { level: "Low", desc: "Minimal risk, continue regular check-ups" },
            {
              level: "Medium",
              desc: "Monitor closely, follow doctor recommendations",
            },
            {
              level: "High",
              desc: "Immediate medical attention recommended",
            },
          ].map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.guideItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.guideBadge,
                  {
                    backgroundColor:
                      item.level === "High"
                        ? "#dc2626"
                        : item.level === "Medium"
                          ? "#ffa500"
                          : colors.primary,
                  },
                ]}
              >
                <Text style={styles.guideLevelText}>{item.level[0]}</Text>
              </View>
              <View style={styles.guideContent}>
                <Text style={[styles.guideLevel, { color: colors.foreground }]}>
                  {item.level}
                </Text>
                <Text style={[styles.guideDesc, { color: colors.muted }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  assessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 8,
  },
  assessButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultLevel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  resultScore: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  recItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  recText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  factorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  factorCard: {
    width: "31%",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  factorIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  factorValue: {
    fontSize: 11,
    fontWeight: "400",
  },
  infoCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  guideBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  guideLevelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  guideContent: {
    flex: 1,
  },
  guideLevel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  guideDesc: {
    fontSize: 11,
    fontWeight: "400",
  },
});
