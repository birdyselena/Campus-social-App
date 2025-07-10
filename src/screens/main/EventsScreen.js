import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Searchbar,
  Button,
  Text,
  Chip,
  Avatar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { eventStorage, coinsService } from "../../services/localStorage";
import { generateAvatarLabel } from "../../utils/avatarHelpers";
import { useFocusEffect } from "@react-navigation/native";

export default function EventsScreen({ navigation }) {
  const { user, updateCoinsBalance } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAttendance, setUserAttendance] = useState({});

  // 使用 useFocusEffect 确保每次页面获得焦点时都重新加载数据
  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [])
  );

  useEffect(() => {
    // Filter events based on search query
    if (searchQuery) {
      const filtered = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [searchQuery, events]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsData = await eventStorage.getAllEvents();
      setEvents(eventsData);

      // 检查用户参与情况
      const attendance = {};
      eventsData.forEach((event) => {
        attendance[event.id] =
          event.attendees && event.attendees.includes(user.id);
      });
      setUserAttendance(attendance);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
    setLoading(false);
  };

  const handleAttendEvent = async (eventId) => {
    try {
      const isAttending = userAttendance[eventId];

      if (isAttending) {
        // 取消参加
        await eventStorage.cancelAttendEvent(eventId, user.id);
        setUserAttendance((prev) => ({
          ...prev,
          [eventId]: false,
        }));
      } else {
        // 参加活动
        await eventStorage.attendEvent(eventId, user.id);
        setUserAttendance((prev) => ({
          ...prev,
          [eventId]: true,
        }));

        // 奖励积分 - 参加活动奖励20积分
        const event = events.find((e) => e.id === eventId);
        if (event) {
          try {
            await coinsService.rewardEventParticipation(
              user.id,
              eventId,
              event.title
            );
            // 可以选择显示奖励提示
            Alert.alert(
              "积分奖励！",
              `参加活动 "${event.title}" 获得了 20 积分！`,
              [{ text: "好的", style: "default" }]
            );
          } catch (error) {
            console.error("Error rewarding coins:", error);
          }
        }
      }

      // 刷新活动列表
      fetchEvents();
    } catch (error) {
      console.error("Error updating event attendance:", error);
    }
  };

  const renderEvent = ({ item }) => (
    <Card
      style={styles.eventCard}
      onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}
    >
      <Card.Content>
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Title numberOfLines={2}>{item.title}</Title>
            <Paragraph numberOfLines={3} style={styles.description}>
              {item.description}
            </Paragraph>
          </View>
          <Avatar.Text
            size={50}
            label={generateAvatarLabel(item.title, "E")}
            style={styles.eventAvatar}
          />
        </View>
        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.metaText}>
              {item.date
                ? `${new Date(item.date).toLocaleDateString()} at ${new Date(
                    item.date
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "No date specified"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.metaText}>
              {item.location || "No location"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.metaText}>
              Organized by {item.organizer || "Unknown"}
            </Text>
          </View>
        </View>
        <View style={styles.tagsContainer}>
          <Chip icon="account-group" style={styles.chip}>
            <Text>{item.attendeeCount || 0} attending</Text>
          </Chip>
          {item.coins_reward && (
            <Chip icon="wallet" style={styles.chip}>
              <Text>+{item.coins_reward} coins</Text>
            </Chip>
          )}
        </View>{" "}
        <View style={styles.actionContainer}>
          <Button
            mode={userAttendance[item.id] ? "contained" : "outlined"}
            onPress={() => handleAttendEvent(item.id)}
            style={styles.attendButton}
            icon={userAttendance[item.id] ? "check" : "plus"}
          >
            <Text>{userAttendance[item.id] ? "Attending" : "Attend"}</Text>
          </Button>

          <Button
            mode="text"
            onPress={() =>
              navigation.navigate("EventDetails", { eventId: item.id })
            }
            style={styles.detailsButton}
          >
            <Text>Details</Text>
          </Button>

          <Button
            mode="text"
            onPress={() =>
              navigation.navigate("GroupDiscussion", {
                groupId: "event_" + item.id,
              })
            }
            style={styles.groupButton}
            icon="forum"
          >
            <Text>Discuss</Text>
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search events..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchEvents} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Create an event to get started
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("CreateEvent")}
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
  eventCard: {
    marginBottom: 16,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  eventAvatar: {
    alignSelf: "flex-start",
  },
  eventMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  attendButton: {
    flex: 1,
    marginRight: 4,
  },
  detailsButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  groupButton: {
    flex: 1,
    marginLeft: 4,
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
