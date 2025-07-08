import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Button } from "react-native-paper";

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Event Details</Text>
          <Text>Event ID: {eventId}</Text>
          <Text style={styles.placeholder}>
            This screen will show detailed event information, attendance
            options, and allow users to interact with the event.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Go Back
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  placeholder: {
    color: "#666",
    marginVertical: 16,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
  },
});
