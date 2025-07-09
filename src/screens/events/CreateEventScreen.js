import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Card,
  Button,
  TextInput,
  HelperText,
  Switch,
  Chip,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { eventStorage } from "../../services/localStorage";

export default function CreateEventScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    coins_reward: "",
    is_public: true,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Event date is required";
    }

    if (!formData.time.trim()) {
      newErrors.time = "Event time is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Event location is required";
    }

    if (formData.coins_reward && isNaN(parseInt(formData.coins_reward))) {
      newErrors.coins_reward = "Coins reward must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create event date-time string
      let eventDateTime;
      try {
        if (formData.date && formData.time) {
          eventDateTime = new Date(
            `${formData.date}T${formData.time}`
          ).toISOString();
        } else {
          eventDateTime = new Date().toISOString();
        }
      } catch (error) {
        console.error("Date parsing error:", error);
        eventDateTime = new Date().toISOString();
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: eventDateTime,
        location: formData.location,
        university: user.university,
        coins_reward: parseInt(formData.coins_reward) || 0,
        is_public: formData.is_public,
        organizer: user.full_name,
        created_by: user.id,
      };

      const newEvent = await eventStorage.createEvent(eventData);

      if (newEvent) {
        Alert.alert("Success", "Event created successfully!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Create Event</Text>

          <TextInput
            label="Event Title"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.title}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title}
          </HelperText>

          <TextInput
            label="Event Description"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            error={!!errors.description}
          />
          <HelperText type="error" visible={!!errors.description}>
            {errors.description}
          </HelperText>

          <TextInput
            label="Event Date (YYYY-MM-DD)"
            value={formData.date}
            onChangeText={(text) => setFormData({ ...formData, date: text })}
            mode="outlined"
            placeholder="2024-12-25"
            style={styles.input}
            error={!!errors.date}
          />
          <HelperText type="error" visible={!!errors.date}>
            {errors.date}
          </HelperText>

          <TextInput
            label="Event Time (HH:MM)"
            value={formData.time}
            onChangeText={(text) => setFormData({ ...formData, time: text })}
            mode="outlined"
            placeholder="14:30"
            style={styles.input}
            error={!!errors.time}
          />
          <HelperText type="error" visible={!!errors.time}>
            {errors.time}
          </HelperText>

          <TextInput
            label="Event Location"
            value={formData.location}
            onChangeText={(text) =>
              setFormData({ ...formData, location: text })
            }
            mode="outlined"
            style={styles.input}
            error={!!errors.location}
          />
          <HelperText type="error" visible={!!errors.location}>
            {errors.location}
          </HelperText>

          <TextInput
            label="Coins Reward (Optional)"
            value={formData.coins_reward}
            onChangeText={(text) =>
              setFormData({ ...formData, coins_reward: text })
            }
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.coins_reward}
          />
          <HelperText type="error" visible={!!errors.coins_reward}>
            {errors.coins_reward}
          </HelperText>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Public Event</Text>
            <Switch
              value={formData.is_public}
              onValueChange={(value) =>
                setFormData({ ...formData, is_public: value })
              }
            />
          </View>
          <HelperText type="info">
            {formData.is_public
              ? "Everyone can see this event"
              : "Only invited people can see this event"}
          </HelperText>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
            >
              Create Event
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    flex: 1,
    marginLeft: 8,
  },
});
