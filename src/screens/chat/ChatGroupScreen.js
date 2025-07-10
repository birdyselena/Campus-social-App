import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Avatar,
  IconButton,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { chatStorage } from "../../services/localStorage";
import { generateAvatarLabel } from "../../utils/avatarHelpers";
import { useFocusEffect } from "@react-navigation/native";

export default function ChatGroupScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 设置header按钮
  useEffect(() => {
    navigation.setOptions({
      title: "Group Chat",
      headerRight: () => (
        <IconButton
          icon="forum"
          size={24}
          onPress={() => navigation.navigate("GroupDiscussion", { groupId })}
        />
      ),
    });
  }, [navigation, groupId]);

  // 使用 useFocusEffect 确保每次页面获得焦点时都重新加载消息
  useFocusEffect(
    React.useCallback(() => {
      fetchMessages();
    }, [])
  );

  const fetchMessages = async () => {
    try {
      const messagesData = await chatStorage.getGroupMessages(groupId);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // 检查用户是否存在
    console.log("Current user:", user); // Debug log
    if (!user || !user.id) {
      Alert.alert("Error", "Please log in to send messages");
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        user_id: user.id,
        group_id: groupId,
        sender_name: user.full_name || user.name || "Unknown User",
      };

      console.log("Sending message:", messageData); // Debug log

      const sentMessage = await chatStorage.sendMessage(messageData);

      console.log("Message sent:", sentMessage); // Debug log

      if (sentMessage) {
        setNewMessage("");
        // Refresh messages to show the new message
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
    setLoading(false);
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = user && user.id && item.user_id === user.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={generateAvatarLabel(item.sender_name)}
            style={styles.messageAvatar}
          />
        )}
        <Card
          style={[
            styles.messageCard,
            isOwnMessage ? styles.ownMessageCard : styles.otherMessageCard,
          ]}
        >
          <Card.Content style={styles.messageContent}>
            {!isOwnMessage && (
              <Text style={styles.senderName}>
                {item.sender_name || "Unknown"}
              </Text>
            )}
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
          maxLength={500}
          mode="outlined"
          dense
          onSubmitEditing={sendMessage}
        />
        <Button
          mode="contained"
          onPress={sendMessage}
          loading={loading}
          disabled={!newMessage.trim() || loading}
          style={styles.sendButton}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  ownMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageCard: {
    maxWidth: "75%",
    elevation: 1,
  },
  ownMessageCard: {
    backgroundColor: "#6200EE",
  },
  otherMessageCard: {
    backgroundColor: "white",
  },
  messageContent: {
    padding: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  otherMessageTime: {
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: "white",
  },
  sendButton: {
    alignSelf: "flex-end",
    minWidth: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
});
