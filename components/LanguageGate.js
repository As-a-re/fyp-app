import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TavusAIAssistant from "./TavusAIComponent";
import TwiAIComponent from "./TwiAIComponent";

/**
 * Language choice happens once, up front, and decides the whole path:
 *   English -> Tavus video avatar (components/TavusAIComponent.js)
 *   Twi     -> free knowledge base (TF-IDF + Groq) + TalkingHead avatar (components/TwiAIComponent.js)
 * The two paths never mix after this point.
 */
export default function LanguageGate() {
  const [selected, setSelected] = useState(null);

  if (selected === "en") return <TavusAIAssistant />;
  if (selected === "tw") return <TwiAIComponent />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>M-CARE AI Assistant</Text>
        <Text style={styles.subtitle}>
          Which language would you like to use for this conversation?
        </Text>

        <TouchableOpacity style={styles.option} onPress={() => setSelected("en")}>
          <Text style={styles.optionFlag}>🇬🇧</Text>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>English</Text>
            <Text style={styles.optionSubtitle}>Video avatar conversation (Tavus)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setSelected("tw")}>
          <Text style={styles.optionFlag}>🇬🇭</Text>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Twi</Text>
            <Text style={styles.optionSubtitle}>
              3D avatar, grounded in our maternal health knowledge base — you can mix Twi and English freely
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 20 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionFlag: { fontSize: 32 },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },
  optionSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
});
