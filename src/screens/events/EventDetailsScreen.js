import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { eventStorage } from "../../services/localStorage";

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { user, updateCoinsBalance } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAttending, setIsAttending] = useState(false);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const events = await eventStorage.getAllEvents();
      const eventData = events.find((e) => e.id === eventId);

      if (eventData) {
        setEvent(eventData);
        setIsAttending(
          eventData.attendees && eventData.attendees.includes(user.id)
        );
      }
    } catch (error) {
      console.error("Error loading event details:", error);
    }
    setLoading(false);
  };

  const handleAttendEvent = async () => {
    try {
      if (isAttending) {
        await eventStorage.cancelAttendEvent(eventId, user.id);
        setIsAttending(false);
        Alert.alert("Success", "Event participation cancelled");
      } else {
        await eventStorage.attendEvent(eventId, user.id);
        setIsAttending(true);

        // Reward coins
        if (event.coins_reward > 0) {
          await updateCoinsBalance(
            event.coins_reward,
            "event_attendance",
            `Attended event: ${event.title}`
          );
        }

        Alert.alert("Success", "Successfully joined the event!");
      }

      // Reload event details
      loadEventDetails();
    } catch (error) {
      console.error("Error updating attendance:", error);
      Alert.alert("Error", "Operation failed, please try again");
    }
  };

  const openLocationInMaps = () => {
    if (event?.location) {
      const query = encodeURIComponent(event.location);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url);
    }
  };

  if (loading || !event) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text>Loading...</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text
              size={60}
              label={event.title.substring(0, 2).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.organizer}>由 {event.organizer} 主办</Text>
            </View>
          </View>

          <Text style={styles.description}>{event.description}</Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                {new Date(event.date).toLocaleDateString()} at{" "}
                {new Date(event.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="school" size={20} color="#666" />
              <Text style={styles.infoText}>{event.university}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {event.attendeeCount || 0} 人参加
              </Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {event.coins_reward > 0 && (
              <Chip icon="wallet" style={styles.chip}>
                +{event.coins_reward} 金币奖励
              </Chip>
            )}
            {event.is_public && (
              <Chip icon="earth" style={styles.chip}>
                公开活动
              </Chip>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode={isAttending ? "contained" : "outlined"}
              onPress={handleAttendEvent}
              style={styles.attendButton}
              icon={isAttending ? "check" : "plus"}
            >
              {isAttending ? "Attending" : "Join Event"}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  organizer: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  mapButton: {
    margin: 0,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  attendButton: {
    flex: 1,
    marginRight: 8,
  },
  backButton: {
    flex: 1,
    marginLeft: 8,
  },
});
