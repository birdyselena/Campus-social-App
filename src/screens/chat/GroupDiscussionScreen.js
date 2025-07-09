import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  Chip,
  FAB,
  IconButton,
  Divider,
  Modal,
  Portal,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { chatStorage } from "../../services/localStorage";
import { useFocusEffect } from "@react-navigation/native";

export default function GroupDiscussionScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
    type: "question", // question, announcement, general
  });

  useFocusEffect(
    React.useCallback(() => {
      loadGroupInfo();
      loadDiscussions();
    }, [])
  );

  const loadGroupInfo = async () => {
    try {
      const groups = await chatStorage.getAllChatGroups();
      const groupInfo = groups.find((g) => g.id === groupId);
      if (groupInfo) {
        setGroup(groupInfo);
        // Set navigation title
        navigation.setOptions({ title: groupInfo.name });
      }
    } catch (error) {
      console.error("Error loading group info:", error);
    }
  };

  const loadDiscussions = async () => {
    setLoading(true);
    try {
      // Load discussions from local storage
      const groupDiscussions = await chatStorage.getGroupDiscussions(groupId);
      setDiscussions(groupDiscussions);
    } catch (error) {
      console.error("Error loading discussions:", error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiscussions();
    setRefreshing(false);
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const discussionData = {
        ...newDiscussion,
        group_id: groupId,
        author_id: user.id,
        author_name: user.full_name,
        replies: [],
        likes: 0,
        created_at: new Date().toISOString(),
      };

      await chatStorage.createDiscussion(discussionData);
      setNewDiscussion({ title: "", content: "", type: "question" });
      setShowCreateModal(false);
      loadDiscussions();
    } catch (error) {
      console.error("Error creating discussion:", error);
      Alert.alert("Error", "Failed to create discussion");
    }
  };

  const handleLikeDiscussion = async (discussionId) => {
    try {
      await chatStorage.likeDiscussion(discussionId, user.id);
      loadDiscussions();
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

  const renderDiscussion = ({ item }) => (
    <Card style={styles.discussionCard}>
      <Card.Content>
        <View style={styles.discussionHeader}>
          <Avatar.Text
            size={40}
            label={item.author_name.substring(0, 2).toUpperCase()}
            style={styles.authorAvatar}
          />
          <View style={styles.discussionInfo}>
            <Text style={styles.authorName}>{item.author_name}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          <Chip
            icon={getTypeIcon(item.type)}
            style={[
              styles.typeChip,
              { backgroundColor: getTypeColor(item.type) },
            ]}
            textStyle={styles.chipText}
          >
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Chip>
        </View>

        <Text style={styles.discussionTitle}>{item.title}</Text>
        <Text style={styles.discussionContent} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.discussionActions}>
          <Button
            mode="text"
            icon="thumb-up"
            onPress={() => handleLikeDiscussion(item.id)}
            style={styles.actionButton}
          >
            {item.likes || 0}
          </Button>
          <Button
            mode="text"
            icon="comment"
            onPress={() =>
              navigation.navigate("DiscussionDetail", {
                discussionId: item.id,
                groupId: groupId,
              })
            }
            style={styles.actionButton}
          >
            {item.replies ? item.replies.length : 0}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Card style={styles.groupInfoCard}>
        <Card.Content>
          <View style={styles.groupHeader}>
            <Avatar.Text
              size={60}
              label={group?.name.substring(0, 2).toUpperCase()}
              style={styles.groupAvatar}
            />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group?.name}</Text>
              <Text style={styles.groupDescription}>{group?.description}</Text>
              <Text style={styles.memberCount}>
                {group?.member_count || 0} members
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="chat"
              onPress={() =>
                navigation.navigate("ChatGroup", { groupId: groupId })
              }
              style={styles.chatButton}
            >
              Live Chat
            </Button>
            <Button
              mode="outlined"
              icon="information"
              onPress={() =>
                navigation.navigate("GroupInfo", { groupId: groupId })
              }
              style={styles.infoButton}
            >
              Group Info
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={discussions}
        renderItem={renderDiscussion}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No discussions yet</Text>
            <Text style={styles.emptySubtext}>
              Start a discussion to get the conversation going!
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Discussion"
        onPress={() => setShowCreateModal(true)}
      />

      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>Create New Discussion</Text>

            <Text style={styles.fieldLabel}>Discussion Type</Text>
            <View style={styles.typeSelector}>
              {["question", "announcement", "general"].map((type) => (
                <Chip
                  key={type}
                  selected={newDiscussion.type === type}
                  onPress={() => setNewDiscussion({ ...newDiscussion, type })}
                  style={styles.typeOptionChip}
                  icon={getTypeIcon(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Title"
              value={newDiscussion.title}
              onChangeText={(text) =>
                setNewDiscussion({ ...newDiscussion, title: text })
              }
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Content"
              value={newDiscussion.content}
              onChangeText={(text) =>
                setNewDiscussion({ ...newDiscussion, content: text })
              }
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowCreateModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateDiscussion}
                style={styles.createButton}
              >
                Create
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
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
  listContainer: {
    paddingBottom: 80,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  groupInfoCard: {
    elevation: 2,
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  groupAvatar: {
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chatButton: {
    flex: 1,
    marginRight: 8,
  },
  infoButton: {
    flex: 1,
    marginLeft: 8,
  },
  discussionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  discussionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    marginRight: 12,
  },
  discussionInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  discussionContent: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  discussionActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  actionButton: {
    marginRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 16,
  },
  typeOptionChip: {
    marginRight: 8,
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    flex: 1,
    marginLeft: 8,
  },
});
