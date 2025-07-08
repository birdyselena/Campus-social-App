import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Searchbar,
  Avatar,
  Text,
  Chip,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [chatGroups, setChatGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChatGroups();
  }, []);

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
      // Mock chat groups data
      const mockGroups = [
        {
          id: "1",
          name: "Computer Science 2025",
          description:
            "CS students discussion group for sharing resources and study tips",
          is_public: true,
          university: "Demo University",
          member_count: 45,
          lastMessage: "Anyone have notes from yesterday's lecture?",
          lastMessageTime: new Date(
            Date.now() - 2 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Campus Events Planning",
          description: "Plan and organize campus activities and social events",
          is_public: true,
          university: "Demo University",
          member_count: 23,
          lastMessage: "Movie night this Friday!",
          lastMessageTime: new Date(
            Date.now() - 4 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Study Buddies",
          description:
            "Find study partners for different subjects and exam prep",
          is_public: true,
          university: "Demo University",
          member_count: 67,
          lastMessage: "Looking for calculus study partner",
          lastMessageTime: new Date(
            Date.now() - 6 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Fitness & Wellness",
          description: "Share workout tips and organize fitness activities",
          is_public: true,
          university: "Demo University",
          member_count: 34,
          lastMessage: "Gym session tomorrow at 6 PM",
          lastMessageTime: new Date(
            Date.now() - 8 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "5",
          name: "International Students",
          description: "Connect with fellow international students",
          is_public: true,
          university: "Demo University",
          member_count: 28,
          lastMessage: "Welcome to our new members!",
          lastMessageTime: new Date(
            Date.now() - 12 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setChatGroups(mockGroups);
    } catch (error) {
      console.error("Error fetching chat groups:", error);
    }
    setLoading(false);
  };

  const joinGroup = async (groupId) => {
    try {
      const { error } = await supabase.from("chat_group_members").insert([
        {
          group_id: groupId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Refresh the groups list
      fetchChatGroups();
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const renderChatGroup = ({ item }) => (
    <Card
      style={styles.groupCard}
      onPress={() => navigation.navigate("ChatGroup", { groupId: item.id })}
    >
      <Card.Content>
        <View style={styles.groupHeader}>
          <Avatar.Text
            size={50}
            label={item.name.substring(0, 2).toUpperCase()}
            style={styles.groupAvatar}
          />
          <View style={styles.groupInfo}>
            <Title numberOfLines={1}>{item.name}</Title>
            <Paragraph numberOfLines={1} style={styles.description}>
              {item.description}
            </Paragraph>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          <View style={styles.groupMeta}>
            <Text style={styles.memberCount}>
              {item.member_count || 0} members
            </Text>
            {item.lastMessageTime && (
              <Text style={styles.timestamp}>
                {new Date(item.lastMessageTime).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tagsContainer}>
          {item.is_public && (
            <Chip icon="earth" style={styles.chip}>
              Public
            </Chip>
          )}
          {item.university && (
            <Chip icon="school" style={styles.chip}>
              {item.university}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
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
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No chat groups found</Text>
            <Text style={styles.emptySubtext}>
              Create or join a group to start chatting
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
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  groupCard: {
    marginBottom: 12,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  groupAvatar: {
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  description: {
    color: "#666",
    fontSize: 14,
  },
  lastMessage: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  groupMeta: {
    alignItems: "flex-end",
  },
  memberCount: {
    fontSize: 12,
    color: "#666",
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    marginRight: 8,
    marginTop: 4,
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
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
