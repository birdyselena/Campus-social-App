import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
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
import { supabase } from "../../services/supabase";

export default function EventsScreen({ navigation }) {
  const { user, updateCoinsBalance } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAttendance, setUserAttendance] = useState({});

  useEffect(() => {
    fetchEvents();
    fetchUserAttendance();
  }, []);

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
      // Mock events data
      const mockEvents = [
        {
          id: "1",
          title: "Campus Career Fair",
          description:
            "Meet recruiters from top tech companies, startups, and traditional businesses. Bring your resume and dress professionally!",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Student Center Main Hall",
          attendeeCount: 156,
          organizer: "Career Services",
          coins_reward: 20,
          users: { full_name: "Career Services" },
          event_attendees: [],
        },
        {
          id: "2",
          title: "Study Group - Advanced Physics",
          description:
            "Weekly physics study group focusing on quantum mechanics and relativity. All levels welcome!",
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Library Room 204",
          attendeeCount: 23,
          organizer: "Physics Student Association",
          coins_reward: 15,
          users: { full_name: "Physics Student Association" },
          event_attendees: [],
        },
        {
          id: "3",
          title: "Campus Movie Night",
          description:
            "Free outdoor movie screening under the stars. Popcorn and drinks provided! This week: The Social Network",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Quad Lawn",
          attendeeCount: 89,
          organizer: "Student Activities Board",
          coins_reward: 10,
          users: { full_name: "Student Activities Board" },
          event_attendees: [],
        },
        {
          id: "4",
          title: "Coding Bootcamp Workshop",
          description:
            "Learn web development basics with HTML, CSS, and JavaScript. Perfect for beginners!",
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Computer Lab B",
          attendeeCount: 67,
          organizer: "Computer Science Club",
          coins_reward: 25,
          users: { full_name: "Computer Science Club" },
          event_attendees: [],
        },
        {
          id: "5",
          title: "Environmental Awareness Seminar",
          description:
            "Learn about sustainable living and how you can make a difference. Guest speakers from Green Peace.",
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Auditorium A",
          attendeeCount: 43,
          organizer: "Environmental Club",
          coins_reward: 15,
          users: { full_name: "Environmental Club" },
          event_attendees: [],
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
    setLoading(false);
  };

  const fetchUserAttendance = async () => {
    try {
      // Mock user attendance - for demo, assume user is attending event with id '2'
      const mockAttendance = {
        2: true, // User is attending the Physics study group
      };

      setUserAttendance(mockAttendance);
    } catch (error) {
      console.error("Error fetching user attendance:", error);
    }
  };

  const handleAttendEvent = async (eventId) => {
    try {
      const isAttending = userAttendance[eventId];

      if (isAttending) {
        // Remove attendance
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;

        setUserAttendance((prev) => ({
          ...prev,
          [eventId]: false,
        }));
      } else {
        // Add attendance
        const { error } = await supabase.from("event_attendees").insert([
          {
            event_id: eventId,
            user_id: user.id,
            joined_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;

        setUserAttendance((prev) => ({
          ...prev,
          [eventId]: true,
        }));

        // Award coins for attending event
        await updateCoinsBalance(
          15,
          "event_attendance",
          "Event attendance bonus"
        );
      }

      // Refresh events to update attendee count
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
            label={item.title.substring(0, 2).toUpperCase()}
            style={styles.eventAvatar}
          />
        </View>

        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.metaText}>
              {new Date(item.date).toLocaleDateString()} at{" "}
              {new Date(item.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.metaText}>Organized by {item.organizer}</Text>
          </View>
        </View>

        <View style={styles.tagsContainer}>
          <Chip icon="account-group" style={styles.chip}>
            {item.attendeeCount} attending
          </Chip>
          {item.coins_reward && (
            <Chip icon="wallet" style={styles.chip}>
              +{item.coins_reward} coins
            </Chip>
          )}
        </View>

        <View style={styles.actionContainer}>
          <Button
            mode={userAttendance[item.id] ? "contained" : "outlined"}
            onPress={() => handleAttendEvent(item.id)}
            style={styles.attendButton}
            icon={userAttendance[item.id] ? "check" : "plus"}
          >
            {userAttendance[item.id] ? "Attending" : "Attend"}
          </Button>

          <Button
            mode="text"
            onPress={() =>
              navigation.navigate("EventDetails", { eventId: item.id })
            }
          >
            Details
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
  },
  attendButton: {
    flex: 1,
    marginRight: 8,
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
