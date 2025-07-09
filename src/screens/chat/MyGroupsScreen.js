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
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { chatStorage } from "../../services/localStorage";
import { useFocusEffect } from "@react-navigation/native";

export default function MyGroupsScreen({ navigation }) {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchMyGroups();
    }, [])
  );

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const allGroups = await chatStorage.getAllChatGroups();
      const userGroups = allGroups.filter(
        (group) => group.members && group.members.includes(user.id)
      );
      setMyGroups(userGroups);
    } catch (error) {
      console.error("Error fetching my groups:", error);
    }
    setLoading(false);
  };

  const renderMyGroup = ({ item }) => (
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
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.metaText}>
                  {new Date(item.updated_at).toLocaleDateString()}
                </Text>
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
          <Button
            mode="contained"
            onPress={() =>
              navigation.navigate("ChatGroup", { groupId: item.id })
            }
            style={styles.chatButton}
          >
            Open Chat
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={myGroups}
        renderItem={renderMyGroup}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMyGroups} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No groups joined yet</Text>
            <Text style={styles.emptySubtext}>
              Join groups to start chatting with others
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("Chat")}
              style={styles.browseButton}
            >
              Browse Groups
            </Button>
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
  listContainer: {
    padding: 16,
  },
  groupCard: {
    marginBottom: 16,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 24,
  },
  browseButton: {
    minWidth: 150,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6200EE",
  },
});
