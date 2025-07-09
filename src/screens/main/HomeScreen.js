import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Text,
  Chip,
  FAB,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

export default function HomeScreen({ navigation }) {
  const { user, userProfile, updateCoinsBalance } = useAuth();
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mock recent events
      const mockEvents = [
        {
          id: "1",
          title: "Campus Career Fair",
          description:
            "Meet recruiters from top companies and explore career opportunities",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Student Center",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Study Group - Physics",
          description: "Weekly physics study group for exam preparation",
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Library Room 204",
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Campus Movie Night",
          description: "Free movie screening under the stars",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Quad Lawn",
          created_at: new Date().toISOString(),
        },
      ];

      // Mock recent chat groups
      const mockChats = [
        {
          id: "1",
          name: "Computer Science 2025",
          description: "CS students discussion group",
          member_count: 45,
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Campus Events Planning",
          description: "Plan and organize campus activities",
          member_count: 23,
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Study Buddies",
          description: "Find study partners for different subjects",
          member_count: 67,
          updated_at: new Date().toISOString(),
        },
      ];

      setRecentEvents(mockEvents);
      setRecentChats(mockChats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  const handleDailyCheckIn = async () => {
    const result = await updateCoinsBalance(
      10,
      "daily_checkin",
      "Daily check-in bonus"
    );
    if (!result.error) {
      alert("Daily check-in complete! +10 coins earned");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />
        }
      >
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <Avatar.Text
                size={60}
                label={userProfile?.full_name?.substring(0, 2) || "U"}
                style={styles.avatar}
              />
              <View style={styles.welcomeText}>
                <Title>Welcome back!</Title>
                <Paragraph>{userProfile?.full_name || "Unknown User"}</Paragraph>
                <Text style={styles.university}>{userProfile?.university || "No university"}</Text>
              </View>
            </View>

            <View style={styles.coinsContainer}>
              <Ionicons name="wallet" size={24} color="#FFD700" />
              <Text style={styles.coinsText}>
                {userProfile?.coins_balance || 0} Coins
              </Text>
              <Button
                mode="outlined"
                compact
                onPress={handleDailyCheckIn}
                style={styles.checkInButton}
              >
                Daily Check-in
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate("CreateEvent")}
                style={styles.actionButton}
              >
                Create Event
              </Button>
              <Button
                mode="contained"
                icon="account-outline"
                onPress={() => navigation.navigate("CreateGroup")}
                style={styles.actionButton}
              >
                New Group
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Events */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Upcoming Events</Title>
              <Button onPress={() => navigation.navigate("Events")}>
                View All
              </Button>
            </View>

            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <Card key={event.id} style={styles.itemCard}>
                  <Card.Content>
                    <Title numberOfLines={1}>{event.title}</Title>
                    <Paragraph numberOfLines={2}>{event.description}</Paragraph>
                    <View style={styles.eventMeta}>
                      <Chip icon="calendar" style={styles.chip}>
                        {new Date(event.date).toLocaleDateString()}
                      </Chip>
                      <Chip icon="map-marker" style={styles.chip}>
                        {event.location}
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Paragraph>No upcoming events</Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Recent Chats */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Recent Chats</Title>
              <Button onPress={() => navigation.navigate("Chat")}>
                View All
              </Button>
            </View>

            {recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <Card
                  key={chat.id}
                  style={styles.itemCard}
                  onPress={() =>
                    navigation.navigate("ChatGroup", { groupId: chat.id })
                  }
                >
                  <Card.Content>
                    <Title numberOfLines={1}>{chat.name}</Title>
                    <Paragraph numberOfLines={1}>{chat.description}</Paragraph>
                    <Text style={styles.memberCount}>
                      {chat.member_count || 0} members
                    </Text>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Paragraph>No recent chats</Paragraph>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={() => {
          // Show action sheet or menu for quick actions
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  university: {
    color: "#666",
    fontStyle: "italic",
  },
  coinsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  checkInButton: {
    marginLeft: 8,
  },
  actionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  itemCard: {
    marginBottom: 8,
    elevation: 1,
  },
  eventMeta: {
    flexDirection: "row",
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
  },
  memberCount: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
