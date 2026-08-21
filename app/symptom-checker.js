import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";
import { symptomAPI } from "../services/api";

const severityMap = { Mild: "Low", Moderate: "Medium", Severe: "High" };

export default function SymptomCheckerScreen() {
  const colors = Colors.light;
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState(null);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const response = await symptomAPI.getMyReviews();
      setReviews(response.reviews || []);
    } catch (error) {
      console.error("Failed to load symptom reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadReviews(); }, [loadReviews]));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo access to attach a symptom image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!symptoms.trim() || !duration.trim() || !severity) {
      Alert.alert("Missing Information", "Please complete symptoms, duration, and severity.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("symptom_text", symptoms.trim());
      formData.append("duration", duration.trim());
      formData.append("severity_level", severityMap[severity]);

      if (image?.uri) {
        formData.append("photo", {
          uri: image.uri,
          name: image.fileName || `symptom-${Date.now()}.jpg`,
          type: image.mimeType || "image/jpeg",
        });
      }

      const response = await symptomAPI.submit(formData);
      Alert.alert(
        "Submitted",
        response.message || "Your symptom report has been submitted for clinician review.",
      );
      setSymptoms("");
      setDuration("");
      setSeverity(null);
      setImage(null);
      await loadReviews();
    } catch (error) {
      Alert.alert("Submission failed", error.message || "Could not submit your symptom report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loadingReviews} onRefresh={loadReviews} />}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Report Symptoms</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Submit symptoms for AI assessment and clinician review.</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Describe your symptoms</Text>
            <TextInput
              style={[styles.textInput, styles.largeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={symptoms} onChangeText={setSymptoms} placeholder="e.g., headache, swelling, nausea" placeholderTextColor={colors.textSecondary} multiline
            />
            <Text style={[styles.label, { color: colors.text }]}>Duration</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={duration} onChangeText={setDuration} placeholder="e.g., 2 days" placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.label, { color: colors.text }]}>Severity</Text>
            <View style={styles.severityContainer}>
              {Object.keys(severityMap).map((level) => (
                <TouchableOpacity key={level} style={[styles.severityOption, { backgroundColor: severity === level ? colors.primary : colors.card, borderColor: severity === level ? colors.primary : colors.border }]} onPress={() => setSeverity(level)}>
                  <Text style={[styles.severityLabel, { color: severity === level ? "#fff" : colors.text }]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Photo (optional)</Text>
            <TouchableOpacity style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage}>
              {image?.uri ? <Image source={{ uri: image.uri }} style={styles.imagePreview} /> : <View style={styles.imagePickerContent}><MaterialCommunityIcons name="camera-plus-outline" size={32} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary }}>Tap to upload</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.submittingButton]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit for Review</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>My Symptom Reviews</Text><TouchableOpacity onPress={loadReviews}><MaterialCommunityIcons name="refresh" size={22} color={colors.primary} /></TouchableOpacity></View>
            {reviews.length === 0 && !loadingReviews ? <Text style={[styles.empty, { color: colors.textSecondary }]}>No submitted symptom reports yet.</Text> : reviews.map((item) => (
              <View key={item.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewTop}><Text style={[styles.reviewDate, { color: colors.text }]}>{new Date(item.created_at).toLocaleString()}</Text><Text style={styles.status}>{item.review_status === "reviewed" ? "Reviewed" : item.review_status === "under_review" ? "Under review" : "Pending"}</Text></View>
                <Text style={[styles.reviewSymptoms, { color: colors.text }]}>{item.symptom_text}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>Severity: {item.severity_level} · Duration: {item.duration || "Not provided"}</Text>
                {item.ai_prediction && <Text style={[styles.meta, { color: colors.textSecondary }]}>AI assessment: {item.ai_prediction}</Text>}
                {item.photo_url && <Image source={{ uri: item.photo_url }} style={styles.reviewImage} />}
                {item.review_status === "reviewed" ? (
                  <View style={styles.feedbackBox}><Text style={styles.feedbackTitle}>Clinician feedback</Text><Text style={[styles.feedbackText, { color: colors.text }]}>{item.review_feedback || "No written feedback was provided."}</Text><Text style={[styles.meta, { color: colors.textSecondary }]}>{item.reviewed_at ? `Reviewed ${new Date(item.reviewed_at).toLocaleString()}` : ""}</Text></View>
                ) : <Text style={[styles.pendingText, { color: colors.textSecondary }]}>A clinician has not completed the review yet.</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, scrollContent: { paddingBottom: 110 }, header: { padding: 20, paddingBottom: 10 }, title: { fontSize: 24, fontWeight: "bold" }, subtitle: { marginTop: 6, lineHeight: 20 }, form: { paddingHorizontal: 20 }, label: { fontSize: 16, fontWeight: "600", marginBottom: 10 }, textInput: { height: 50, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1 }, largeInput: { height: 120, textAlignVertical: "top", paddingTop: 15 }, severityContainer: { flexDirection: "row", marginBottom: 20 }, severityOption: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginHorizontal: 4, borderWidth: 1 }, severityLabel: { fontSize: 14, fontWeight: "600" }, imagePicker: { height: 150, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 20, borderWidth: 1, borderStyle: "dashed", overflow: "hidden" }, imagePickerContent: { alignItems: "center" }, imagePreview: { width: "100%", height: "100%" }, submitButton: { minHeight: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" }, submittingButton: { opacity: 0.7 }, submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }, reviewsSection: { paddingHorizontal: 20, marginTop: 28 }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, sectionTitle: { fontSize: 20, fontWeight: "700" }, empty: { paddingVertical: 16 }, reviewCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 }, reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, reviewDate: { fontSize: 12, flex: 1 }, status: { backgroundColor: "#e8f5e9", color: "#237a3b", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontWeight: "700", fontSize: 11 }, reviewSymptoms: { fontSize: 16, fontWeight: "600", lineHeight: 22 }, meta: { fontSize: 12, marginTop: 5, lineHeight: 18 }, reviewImage: { width: "100%", height: 180, borderRadius: 10, marginTop: 10 }, feedbackBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "#eef6ff" }, feedbackTitle: { fontWeight: "700", marginBottom: 6, color: "#1d4ed8" }, feedbackText: { lineHeight: 20 }, pendingText: { marginTop: 10, fontStyle: "italic" },
});
