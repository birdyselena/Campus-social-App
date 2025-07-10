import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Text,
  Chip,
  FAB,
  Surface,
} from "react-native-paper";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { coinsService } from "../../services/localStorage";
import { generateAvatarLabel } from "../../utils/avatarHelpers";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
      fetchCoinsBalance();
    }, [])
  );

  const fetchCoinsBalance = async () => {
    if (user?.id) {
      try {
        const balance = await coinsService.getUserCoinsBalance(user.id);
        setCoinsBalance(balance);
      } catch (error) {
        console.error("Error fetching coins balance:", error);
      }
    }
  };

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
                label={generateAvatarLabel(
                  userProfile?.full_name || user?.name,
                  "U"
                )}
                style={styles.avatar}
              />
              <View style={styles.welcomeText}>
                <Title>Welcome back!</Title>
                <Paragraph>
                  {userProfile?.full_name || user?.name || "Unknown User"}
                </Paragraph>
                <Text style={styles.university}>
                  {userProfile?.university ||
                    user?.university ||
                    "No university"}
                </Text>
              </View>
            </View>

            {/* Coins Display */}
            <TouchableOpacity
              style={styles.coinsContainer}
              onPress={() => navigation.navigate("Coins")}
            >
              <MaterialCommunityIcons name="wallet" size={24} color="#FFD700" />
              <View style={styles.coinsInfo}>
                <Text style={styles.coinsText}>{coinsBalance}</Text>
                <Text style={styles.coinsLabel}>积分</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Button
                mode="outlined"
                icon="gift"
                onPress={async () => {
                  try {
                    await coinsService.rewardDailyLogin(user.id);
                    await fetchCoinsBalance();
                    Alert.alert("签到成功！", "每日登录奖励已领取！+10积分", [
                      { text: "好的", style: "default" },
                    ]);
                  } catch (error) {
                    Alert.alert(
                      "提示",
                      error.message || "今天已经领取过奖励了！",
                      [{ text: "好的", style: "default" }]
                    );
                  }
                }}
                style={styles.actionButton}
              >
                每日签到
              </Button>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate("CreateEvent")}
                style={styles.actionButton}
              >
                创建活动
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
                icon="account-group"
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
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : "No date"}
                      </Chip>
                      <Chip icon="map-marker" style={styles.chip}>
                        {event.location || "No location"}
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
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  coinsInfo: {
    flex: 1,
    marginLeft: 8,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  coinsLabel: {
    fontSize: 12,
    color: "#666",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  actionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
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
