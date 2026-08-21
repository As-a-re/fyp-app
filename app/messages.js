import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { messageAPI } from "../services/api";

const ConversationItem = ({ item, onPress, colors }) => {
  // Handle both mock and real data formats
  // Backend returns: { user: {...}, lastMessage: {...}, unreadCount: 0 }
  const user = item.user || item;
  const displayName =
    user?.name || user?.userName || user?.user_name || "Unknown";

  // Extract message text from lastMessage object
  const lastMessageObj = item.lastMessage || {};
  const lastMsg =
    typeof lastMessageObj === "string"
      ? lastMessageObj
      : lastMessageObj.message || "No messages yet";

  // Format timestamp
  const messageTime = lastMessageObj.created_at || "";
  const time = messageTime
    ? new Date(messageTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const avatar =
    item.avatar ||
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200";

  return (
    <TouchableOpacity
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.conversationText}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {displayName}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
          {lastMsg}
        </Text>
      </View>
      {time && (
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {time}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const MessageBubble = ({ message, colors, isSender }) => (
  <View
    style={[
      styles.messageBubble,
      isSender
        ? { backgroundColor: colors.primary, alignSelf: "flex-end" }
        : { backgroundColor: colors.card, alignSelf: "flex-start" },
    ]}
  >
    <Text
      style={[styles.messageText, { color: isSender ? "#fff" : colors.text }]}
    >
      {message.message || message.text || ""}
    </Text>
  </View>
);

export default function MessagesScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, []),
  );

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getConversations({ limit: 50 });
      const convList = response.conversations || [];
      setConversations(convList);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      // Extract the other user's ID from the backend structure
      const userId =
        conversation.user?.id || conversation.user_id || conversation.id;

      if (!userId) {
        console.error(
          "Unable to extract user ID from conversation:",
          conversation,
        );
        Alert.alert("Error", "Failed to load conversation. Invalid user data.");
        setMessages([]);
        return;
      }

      const response = await messageAPI.getConversation(userId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load conversation messages.");
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim().length > 0) {
      setSending(true);
      try {
        const userId =
          selectedConversation.user?.id ||
          selectedConversation.user_id ||
          selectedConversation.id;

        if (!userId) {
          Alert.alert("Error", "Invalid conversation. Please select another.");
          setSending(false);
          return;
        }

        await messageAPI.sendMessage({
          recipient_id: userId,
          message: inputText,
          message_type: "text",
        });
        // Reload messages after sending
        const response = await messageAPI.getConversation(userId);
        setMessages(response.messages || []);
        setInputText("");
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send message. Please try again.");
      } finally {
        setSending(false);
      }
    }
  };

  if (selectedConversation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <View
            style={[styles.chatHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Image
              source={{
                uri:
                  selectedConversation.avatar ||
                  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200",
              }}
              style={styles.chatAvatar}
            />
            <Text style={[styles.chatUserName, { color: colors.text }]}>
              {selectedConversation.user?.name ||
                selectedConversation.userName ||
                "Unknown"}
            </Text>
          </View>

          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                colors={colors}
                isSender={item.sender_id === user?.id}
              />
            )}
            keyExtractor={(item, index) => item.id || `message-${index}`}
            contentContainerStyle={styles.messagesContainer}
            inverted
          />

          <View
            style={[styles.inputContainer, { backgroundColor: colors.card }]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={sending}
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              onPress={() => handleSelectConversation(item)}
              colors={colors}
            />
          )}
          keyExtractor={(item, index) => {
            // Try multiple ways to get a unique key
            const key = item.user?.id || item.user_id || item.id;
            return key ? key.toString() : `conversation-${index}`;
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No conversations yet
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
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  conversationText: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { fontSize: 14, marginTop: 2 },
  timestamp: { fontSize: 12 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  chatUserName: { fontSize: 18, fontWeight: "bold" },
  messagesContainer: { padding: 10, flexDirection: "column-reverse" },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: "80%",
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 25,
  },
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
