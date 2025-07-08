import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Switch,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

export default function CreateGroupScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [university, setUniversity] = useState(userProfile?.university || "");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setLoading(true);
    try {
      // Create the chat group
      const { data: groupData, error: groupError } = await supabase
        .from("chat_groups")
        .insert([
          {
            name: groupName,
            description,
            is_public: isPublic,
            university,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 1,
          },
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as a member
      const { error: memberError } = await supabase
        .from("chat_group_members")
        .insert([
          {
            group_id: groupData.id,
            user_id: user.id,
            role: "admin",
            joined_at: new Date().toISOString(),
          },
        ]);

      if (memberError) throw memberError;

      Alert.alert("Success", "Group created successfully!", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
            navigation.navigate("ChatGroup", { groupId: groupData.id });
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create group: " + error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Create New Group</Text>

          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            mode="outlined"
            style={styles.input}
            maxLength={50}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <TextInput
            label="University (Optional)"
            value={university}
            onChangeText={setUniversity}
            mode="outlined"
            style={styles.input}
            placeholder="Leave empty for all universities"
          />

          <View style={styles.switchContainer}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Public Group</Text>
              <Text style={styles.switchDescription}>
                Anyone can find and join this group
              </Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Group Guidelines:</Text>
            <Text style={styles.infoText}>
              • Keep discussions relevant and respectful
            </Text>
            <Text style={styles.infoText}>
              • No spam or inappropriate content
            </Text>
            <Text style={styles.infoText}>
              • Follow your university's code of conduct
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleCreateGroup}
            style={styles.createButton}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : "Create Group"}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
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
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  switchDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  infoContainer: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  createButton: {
    paddingVertical: 8,
  },
});
