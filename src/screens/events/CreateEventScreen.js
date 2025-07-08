import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Button } from "react-native-paper";

export default function CreateEventScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Create Event</Text>
          <Text style={styles.placeholder}>
            This screen will allow users to create new campus events with:
            {"\n"}• Event details (title, description, date, time)
            {"\n"}• Location information
            {"\n"}• Attendance limits
            {"\n"}• Coin rewards for attendance
            {"\n"}• Event categories and tags
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
