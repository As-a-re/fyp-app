import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { userAPI } from "../services/api";

export default function PregnancyProfileScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [loading, setLoading] = useState(true);
  const [pregnancyProfile, setPregnancyProfile] = useState(null);
  const [expanded, setExpanded] = useState({
    development: false,
    checkups: false,
    milestones: false,
  });

  useEffect(() => {
    loadPregnancyProfile();
  }, []);

  const loadPregnancyProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getPregnancyProfile();
      setPregnancyProfile(response.profile || {});
    } catch (error) {
      console.error("Failed to load pregnancy profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const profile = pregnancyProfile || {};

  const milestones = [
    { week: 8, title: "Heartbeat Detected", completed: true },
    { week: 12, title: "First Trimester Complete", completed: true },
    { week: 20, title: "Mid-Pregnancy Scan", completed: true },
    { week: 28, title: "Third Trimester Begins", completed: false },
    { week: 40, title: "Due Date", completed: false },
  ];

  const ExpandableSection = ({
    title,
    icon,
    expanded: isExpanded,
    onPress,
    children,
  }) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={onPress}
      >
        <View style={styles.sectionHeaderLeft}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {title}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View
          style={[
            styles.sectionContent,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );

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
            Pregnancy Profile
          </Text>
          <TouchableOpacity onPress={() => router.push("/edit-profile")}>
            <MaterialCommunityIcons
              name="pencil"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {profile.gestational_age || "28"}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Weeks
              </Text>
            </View>
            <View
              style={[
                styles.summaryDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {profile.trimester || "2nd"}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Trimester
              </Text>
            </View>
            <View
              style={[
                styles.summaryDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {profile.due_date || "Jun 15"}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Due Date
              </Text>
            </View>
          </View>
        </View>

        {/* Baby Development Section */}
        <ExpandableSection
          title="Baby Development"
          icon="baby-carriage"
          expanded={expanded.development}
          onPress={() => toggleExpanded("development")}
        >
          <View style={styles.contentGrid}>
            <View style={styles.contentItem}>
              <Text style={[styles.contentLabel, { color: colors.muted }]}>
                Weight
              </Text>
              <Text style={[styles.contentValue, { color: colors.foreground }]}>
                {profile.baby_weight || "1 lb"} (approx)
              </Text>
            </View>
            <View style={styles.contentItem}>
              <Text style={[styles.contentLabel, { color: colors.muted }]}>
                Length
              </Text>
              <Text style={[styles.contentValue, { color: colors.foreground }]}>
                {profile.baby_length || "15 in"} (approx)
              </Text>
            </View>
            <View style={styles.contentItem}>
              <Text style={[styles.contentLabel, { color: colors.muted }]}>
                Position
              </Text>
              <Text style={[styles.contentValue, { color: colors.foreground }]}>
                {profile.baby_position || "Head Down"}
              </Text>
            </View>
            <View style={styles.contentItem}>
              <Text style={[styles.contentLabel, { color: colors.muted }]}>
                Heart Rate
              </Text>
              <Text style={[styles.contentValue, { color: colors.foreground }]}>
                {profile.baby_heart_rate || "140"} bpm
              </Text>
            </View>
          </View>
        </ExpandableSection>

        {/* Checkups Section */}
        <ExpandableSection
          title="Checkups"
          icon="clipboard-list"
          expanded={expanded.checkups}
          onPress={() => toggleExpanded("checkups")}
        >
          <View style={styles.checkupItem}>
            <View style={styles.checkupHeader}>
              <Text style={[styles.checkupTitle, { color: colors.foreground }]}>
                Last Checkup
              </Text>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.checkupDetail, { color: colors.muted }]}>
              Date: {profile.last_checkup_date || "Mar 20, 2026"}
            </Text>
            <Text style={[styles.checkupDetail, { color: colors.muted }]}>
              Doctor: {profile.doctor_name || "Dr. Sarah Johnson"}
            </Text>
            <Text style={[styles.checkupDetail, { color: colors.muted }]}>
              Status: All normal
            </Text>
          </View>

          <View
            style={[
              styles.nextCheckupItem,
              {
                backgroundColor: colors.background,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.checkupHeader}>
              <Text style={[styles.checkupTitle, { color: colors.foreground }]}>
                Next Checkup
              </Text>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.checkupDetail, { color: colors.muted }]}>
              Scheduled: {profile.next_checkup_date || "Apr 10, 2026"}
            </Text>
            <Text style={[styles.checkupDetail, { color: colors.muted }]}>
              Location: {profile.clinic_name || "Maternity Clinic"}
            </Text>
          </View>
        </ExpandableSection>

        {/* Milestones Timeline */}
        <ExpandableSection
          title="Pregnancy Milestones"
          icon="timeline"
          expanded={expanded.milestones}
          onPress={() => toggleExpanded("milestones")}
        >
          <View style={styles.timeline}>
            {milestones.map((milestone, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineIndicator}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: milestone.completed
                          ? colors.primary
                          : colors.muted,
                      },
                    ]}
                  />
                  {idx < milestones.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text
                      style={[
                        styles.timelineWeek,
                        { color: colors.foreground },
                      ]}
                    >
                      Week {milestone.week}
                    </Text>
                    {milestone.completed && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </View>
                  <Text style={[styles.timelineTitle, { color: colors.muted }]}>
                    {milestone.title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ExpandableSection>
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
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
  },
  contentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  contentItem: {
    width: "48%",
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  contentValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  checkupItem: {
    marginBottom: 12,
    paddingBottom: 12,
  },
  checkupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  checkupTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  checkupDetail: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 4,
  },
  nextCheckupItem: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
  },
  timeline: {
    paddingLeft: 0,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: "center",
    marginRight: 12,
    width: 30,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timelineWeek: {
    fontSize: 13,
    fontWeight: "700",
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
});
