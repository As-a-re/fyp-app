import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { doctorAPI } from "../services/api";

export default function SymptomReviewsScreen() {
  const colors = Colors.light;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await doctorAPI.getSymptomReviews();
      setReviews(response.reviews || []);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to load symptom reviews");
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!selected || feedback.trim().length < 5) {
      Alert.alert("Feedback required", "Enter at least 5 characters of clinical feedback.");
      return;
    }
    setSaving(true);
    try {
      await doctorAPI.submitSymptomReview(selected.id, feedback.trim());
      Alert.alert("Review submitted", "The patient has been notified and can view your feedback.");
      setSelected(null); setFeedback(""); await load();
    } catch (e) { Alert.alert("Error", e.message || "Failed to submit review"); }
    finally { setSaving(false); }
  };

  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
    <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Symptom Reviews</Text><TouchableOpacity onPress={load}><MaterialCommunityIcons name="refresh" size={24} color={colors.primary}/></TouchableOpacity></View>
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} contentContainerStyle={styles.content}>
      {loading && reviews.length === 0 ? <ActivityIndicator size="large" color={colors.primary}/> : reviews.length === 0 ? <Text style={[styles.empty, { color: colors.textSecondary }]}>No pending symptom reports from your assigned patients.</Text> : reviews.map(item => <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}><Text style={[styles.patient, { color: colors.text }]}>{item.patient?.name || "Patient"}</Text><Text style={styles.status}>{item.review_status}</Text></View>
        <Text style={[styles.symptoms, { color: colors.text }]}>{item.symptom_text}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Severity: {item.severity_level} · Duration: {item.duration || "Not provided"}</Text>
        {item.ai_prediction && <Text style={[styles.meta, { color: colors.textSecondary }]}>AI assessment: {item.ai_prediction} ({Math.round((item.ai_confidence || 0) * 100)}%)</Text>}
        {item.photo_url && <Image source={{ uri: item.photo_url }} style={styles.image}/>} 
        <TouchableOpacity style={[styles.reviewButton, { backgroundColor: colors.primary }]} onPress={() => { setSelected(item); setFeedback(""); }}><Text style={styles.reviewButtonText}>Review Report</Text></TouchableOpacity>
      </View>)}
    </ScrollView>
    <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
      <View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.card }]}><Text style={[styles.modalTitle, { color: colors.text }]}>Clinical Feedback</Text><Text style={[styles.modalSymptoms, { color: colors.text }]}>{selected?.symptom_text}</Text><TextInput value={feedback} onChangeText={setFeedback} multiline placeholder="Enter your clinical feedback and next steps..." placeholderTextColor={colors.textSecondary} style={[styles.feedbackInput, { color: colors.text, borderColor: colors.border }]} /><View style={styles.modalActions}><TouchableOpacity onPress={() => setSelected(null)} style={styles.cancel}><Text>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={submit} disabled={saving} style={[styles.save, { backgroundColor: colors.primary }]}>{saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveText}>Submit Review</Text>}</TouchableOpacity></View></View></View>
    </Modal>
  </SafeAreaView>;
}

const styles=StyleSheet.create({container:{flex:1},header:{padding:16,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},title:{fontSize:24,fontWeight:"700"},content:{padding:16,paddingBottom:100},empty:{textAlign:"center",marginTop:40},card:{borderWidth:1,borderRadius:14,padding:14,marginBottom:14},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},patient:{fontSize:17,fontWeight:"700"},status:{fontSize:11,textTransform:"uppercase",fontWeight:"700",color:"#a15c00"},symptoms:{fontSize:16,fontWeight:"600",marginTop:10,lineHeight:22},meta:{fontSize:12,marginTop:5},image:{width:"100%",height:180,borderRadius:10,marginTop:10},reviewButton:{marginTop:12,minHeight:44,borderRadius:10,alignItems:"center",justifyContent:"center"},reviewButtonText:{color:"#fff",fontWeight:"700"},modalBackdrop:{flex:1,backgroundColor:"rgba(0,0,0,.55)",justifyContent:"flex-end"},modal:{padding:20,borderTopLeftRadius:20,borderTopRightRadius:20,minHeight:360},modalTitle:{fontSize:20,fontWeight:"700"},modalSymptoms:{marginTop:10,lineHeight:20},feedbackInput:{borderWidth:1,borderRadius:10,minHeight:140,padding:12,marginTop:16,textAlignVertical:"top"},modalActions:{flexDirection:"row",justifyContent:"flex-end",gap:10,marginTop:14},cancel:{padding:12},save:{paddingHorizontal:16,paddingVertical:12,borderRadius:10},saveText:{color:"#fff",fontWeight:"700"}});
