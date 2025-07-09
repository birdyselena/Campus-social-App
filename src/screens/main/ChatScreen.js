import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Text,
  Avatar,
  Button,
  Searchbar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { chatStorage } from "../../services/localStorage";
import { useFocusEffect } from "@react-navigation/native";

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [chatGroups, setChatGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchChatGroups();
    }, [])
  );

  useEffect(() => {
    // Filter groups based on search query
    if (searchQuery) {
      const filtered = chatGroups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(chatGroups);
    }
  }, [searchQuery, chatGroups]);

  const fetchChatGroups = async () => {
    setLoading(true);
    try {
      const groups = await chatStorage.getAllChatGroups();
      setChatGroups(groups);
    } catch (error) {
      console.error("Error fetching chat groups:", error);
    }
    setLoading(false);
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await chatStorage.joinChatGroup(groupId, user.id);
      fetchChatGroups(); // Refresh the list
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const renderChatGroup = ({ item }) => {
    const isJoined = item.members && item.members.includes(user.id);

    return (
      <Card style={styles.groupCard}>
        <Card.Content>
          <View style={styles.groupHeader}>
            <Avatar.Text
              size={50}
              label={item.name.substring(0, 2).toUpperCase()}
              style={styles.groupAvatar}
            />
            <View style={styles.groupInfo}>
              <Title numberOfLines={1}>{item.name}</Title>
              <Paragraph numberOfLines={2} style={styles.description}>
                {item.description}
              </Paragraph>
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>
                    {item.member_count || 0} members
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="school" size={16} color="#666" />
                  <Text style={styles.metaText}>{item.university}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <Button
              mode="text"
              onPress={() =>
                navigation.navigate("GroupInfo", { groupId: item.id })
              }
              style={styles.infoButton}
            >
              View Info
            </Button>
            {isJoined ? (
              <Button
                mode="contained"
                onPress={() =>
                  navigation.navigate("GroupDiscussion", { groupId: item.id })
                }
                style={styles.chatButton}
              >
                Open Discussion
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => handleJoinGroup(item.id)}
                style={styles.joinButton}
              >
                Join Group
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("MyGroups")}
          style={styles.myGroupsButton}
          icon="account"
        >
          My Groups
        </Button>
      </View>

      <Searchbar
        placeholder="Search groups..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredGroups}
        renderItem={renderChatGroup}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchChatGroups} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No groups found</Text>
            <Text style={styles.emptySubtext}>
              Create or join groups to start chatting
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("CreateGroup")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  myGroupsButton: {
    marginBottom: 8,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  groupCard: {
    marginBottom: 16,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  groupAvatar: {
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  description: {
    color: "#666",
    marginVertical: 4,
  },
  metaInfo: {
    flexDirection: "row",
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    color: "#666",
    fontSize: 12,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  infoButton: {
    marginRight: 8,
  },
  chatButton: {
    minWidth: 100,
  },
  joinButton: {
    minWidth: 100,
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
});
