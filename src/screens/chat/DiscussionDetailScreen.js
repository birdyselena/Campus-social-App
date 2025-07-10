import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  Chip,
  IconButton,
  Divider,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { chatStorage } from "../../services/localStorage";
import {
  generateAvatarLabel,
  getUserDisplayName,
} from "../../utils/avatarHelpers";

export default function DiscussionDetailScreen({ route, navigation }) {
  const { discussionId, groupId } = route.params;
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDiscussion();
  }, [discussionId]);

  const loadDiscussion = async () => {
    try {
      const discussionData = await chatStorage.getDiscussionById(discussionId);
      if (discussionData) {
        setDiscussion(discussionData);
        setReplies(discussionData.replies || []);
        navigation.setOptions({ title: discussionData.title });
      }
    } catch (error) {
      console.error("Error loading discussion:", error);
    }
  };

  const handleReply = async () => {
    if (!newReply.trim()) {
      Alert.alert("Error", "Please enter a reply");
      return;
    }

    setLoading(true);
    try {
      const replyData = {
        content: newReply.trim(),
        author_id: user.id,
        author_name: user.full_name,
        created_at: new Date().toISOString(),
      };

      await chatStorage.addDiscussionReply(discussionId, replyData);
      setNewReply("");
      loadDiscussion();
    } catch (error) {
      console.error("Error adding reply:", error);
      Alert.alert("Error", "Failed to add reply");
    }
    setLoading(false);
  };

  const handleLike = async () => {
    try {
      await chatStorage.likeDiscussion(discussionId, user.id);
      loadDiscussion();
    } catch (error) {
      console.error("Error liking discussion:", error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "question":
        return "#2196F3";
      case "announcement":
        return "#FF9800";
      case "general":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "question":
        return "help-circle";
      case "announcement":
        return "bullhorn";
      case "general":
        return "chat";
      default:
        return "message";
    }
  };

  const renderReply = (reply, index) => (
    <View key={index} style={styles.replyContainer}>
      <View style={styles.replyHeader}>
        <Avatar.Text
          size={32}
          label={generateAvatarLabel(reply.author_name)}
          style={styles.replyAvatar}
        />
        <View style={styles.replyInfo}>
          <Text style={styles.replyAuthor}>
            {reply.author_name || "Unknown"}
          </Text>
          <Text style={styles.replyTimestamp}>
            {new Date(reply.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
      <Text style={styles.replyContent}>{reply.content}</Text>
    </View>
  );

  if (!discussion) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView}>
        <Card style={styles.discussionCard}>
          <Card.Content>
            <View style={styles.discussionHeader}>
              <Avatar.Text
                size={50}
                label={generateAvatarLabel(discussion.author_name)}
                style={styles.authorAvatar}
              />
              <View style={styles.discussionInfo}>
                <Text style={styles.authorName}>
                  {discussion.author_name || "Unknown"}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(discussion.created_at).toLocaleString()}
                </Text>
              </View>
              <Chip
                icon={getTypeIcon(discussion.type)}
                style={[
                  styles.typeChip,
                  { backgroundColor: getTypeColor(discussion.type) },
                ]}
                textStyle={styles.chipText}
              >
                {discussion.type.charAt(0).toUpperCase() +
                  discussion.type.slice(1)}
              </Chip>
            </View>

            <Text style={styles.discussionTitle}>{discussion.title}</Text>
            <Text style={styles.discussionContent}>{discussion.content}</Text>

            <View style={styles.discussionActions}>
              <Button
                mode="text"
                icon="thumb-up"
                onPress={handleLike}
                style={styles.actionButton}
              >
                {discussion.likes || 0} Likes
              </Button>
              <Button mode="text" icon="comment" style={styles.actionButton}>
                {replies.length} Replies
              </Button>
              <Button
                mode="text"
                icon="chat"
                onPress={() =>
                  navigation.navigate("ChatGroup", { groupId: groupId })
                }
                style={styles.actionButton}
              >
                Live Chat
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.repliesSection}>
          <Text style={styles.repliesTitle}>Replies ({replies.length})</Text>

          {replies.map((reply, index) => renderReply(reply, index))}
        </View>
      </ScrollView>

      <View style={styles.replyInputContainer}>
        <TextInput
          label="Write a reply..."
          value={newReply}
          onChangeText={setNewReply}
          mode="outlined"
          multiline
          style={styles.replyInput}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleReply}
              disabled={loading || !newReply.trim()}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  discussionCard: {
    margin: 16,
    elevation: 2,
  },
  discussionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  authorAvatar: {
    marginRight: 16,
  },
  discussionInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  typeChip: {
    height: 28,
  },
  chipText: {
    color: "white",
    fontSize: 12,
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  discussionContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 16,
  },
  discussionActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  actionButton: {
    marginRight: 16,
  },
  divider: {
    marginVertical: 8,
  },
  repliesSection: {
    padding: 16,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  replyContainer: {
    backgroundColor: "white",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  replyAvatar: {
    marginRight: 12,
  },
  replyInfo: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  replyTimestamp: {
    fontSize: 12,
    color: "#666",
  },
  replyContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  replyInputContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  replyInput: {
    maxHeight: 100,
  },
});
