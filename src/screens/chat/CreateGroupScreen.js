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
import { chatStorage, coinsService } from "../../services/localStorage";

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
      const groupData = {
        name: groupName,
        description,
        is_public: isPublic,
        university: university || user.university,
        created_by: user.id,
      };

      const newGroup = await chatStorage.createChatGroup(groupData);

      if (newGroup) {
        // 奖励创建群聊积分 - 创建群聊奖励30积分
        try {
          await coinsService.rewardGroupCreation(
            user.id,
            newGroup.id,
            groupName
          );
          Alert.alert(
            "创建成功！",
            `群聊 "${groupName}" 创建成功！\n您获得了 30 积分奖励！`,
            [
              {
                text: "进入聊天",
                onPress: () => {
                  navigation.navigate("ChatGroup", { groupId: newGroup.id });
                },
              },
              {
                text: "稍后",
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        } catch (error) {
          console.error("Error rewarding coins:", error);
          Alert.alert("Success", "Group created successfully!", [
            {
              text: "Go to Chat",
              onPress: () => {
                navigation.navigate("ChatGroup", { groupId: newGroup.id });
              },
            },
            {
              text: "Later",
              onPress: () => {
                navigation.goBack();
              },
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
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
            placeholder="Enter group name"
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Describe your group..."
          />

          <TextInput
            label="University"
            value={university}
            onChangeText={setUniversity}
            mode="outlined"
            style={styles.input}
            placeholder="University name"
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Public Group</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
          <Text style={styles.switchHelp}>
            {isPublic
              ? "Anyone can find and join this group"
              : "Only invited members can join"}
          </Text>

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
              onPress={handleCreateGroup}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
            >
              Create Group
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
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  switchHelp: {
    fontSize: 12,
    color: "#666",
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
