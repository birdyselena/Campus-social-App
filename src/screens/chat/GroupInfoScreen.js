import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Avatar,
  Divider,
  List,
  Chip,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { chatStorage, userStorage } from "../../services/localStorage";
import { generateAvatarLabel } from "../../utils/avatarHelpers";
import { useFocusEffect } from "@react-navigation/native";

export default function GroupInfoScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchGroupInfo();
    }, [])
  );

  const fetchGroupInfo = async () => {
    setLoading(true);
    try {
      const groups = await chatStorage.getAllChatGroups();
      const currentGroup = groups.find((g) => g.id === groupId);

      if (currentGroup) {
        setGroup(currentGroup);
        setIsJoined(
          currentGroup.members && currentGroup.members.includes(user.id)
        );

        // Get member details
        const allUsers = await userStorage.getAllUsers();
        const groupMembers = allUsers.filter(
          (u) => currentGroup.members && currentGroup.members.includes(u.id)
        );
        setMembers(groupMembers);
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
    }
    setLoading(false);
  };

  const handleJoinGroup = async () => {
    try {
      await chatStorage.joinChatGroup(groupId, user.id);
      setIsJoined(true);
      fetchGroupInfo();
      Alert.alert("Success", "You have joined the group!");
    } catch (error) {
      console.error("Error joining group:", error);
      Alert.alert("Error", "Failed to join group. Please try again.");
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await chatStorage.leaveChatGroup(groupId, user.id);
            setIsJoined(false);
            fetchGroupInfo();
            Alert.alert("Success", "You have left the group.");
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave group. Please try again.");
          }
        },
      },
    ]);
  };

  const renderMember = (member) => (
    <List.Item
      key={member.id}
      title={member.full_name}
      description={`${member.university} - ${member.student_id}`}
      left={(props) => (
        <Avatar.Text
          {...props}
          size={40}
          label={generateAvatarLabel(member.full_name, "U")}
        />
      )}
      right={(props) =>
        member.id === group?.created_by ? (
          <Chip {...props} mode="outlined" compact>
            Admin
          </Chip>
        ) : null
      }
    />
  );

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading group information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Avatar.Text
              size={80}
              label={generateAvatarLabel(group.name, "G")}
              style={styles.groupAvatar}
            />
            <View style={styles.groupBasicInfo}>
              <Title style={styles.groupName}>{group.name}</Title>
              <Paragraph style={styles.groupDescription}>
                {group.description}
              </Paragraph>
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {group.member_count || 0} members
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="school" size={16} color="#666" />
                  <Text style={styles.statText}>{group.university}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.statText}>
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.actionCard}>
        <Card.Content>
          <View style={styles.actionContainer}>
            {isJoined ? (
              <>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("ChatGroup", { groupId })}
                  style={styles.primaryButton}
                  icon="message"
                >
                  Open Chat
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleLeaveGroup}
                  style={styles.secondaryButton}
                  icon="exit-to-app"
                >
                  Leave Group
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={handleJoinGroup}
                style={styles.primaryButton}
                icon="account-plus"
                loading={loading}
              >
                Join Group
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.membersCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Members ({members.length})</Title>
          <Divider style={styles.divider} />
          {members.length > 0 ? (
            members.map(renderMember)
          ) : (
            <View style={styles.emptyMembers}>
              <Text style={styles.emptyText}>No members to display</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.detailsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Group Details</Title>
          <Divider style={styles.divider} />

          <List.Item
            title="Group Type"
            description={group.is_public ? "Public" : "Private"}
            left={(props) => <List.Icon {...props} icon="earth" />}
          />

          <List.Item
            title="University"
            description={group.university}
            left={(props) => <List.Icon {...props} icon="school" />}
          />

          <List.Item
            title="Created"
            description={new Date(group.created_at).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />

          <List.Item
            title="Last Updated"
            description={new Date(group.updated_at).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="clock" />}
          />
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
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupAvatar: {
    marginRight: 16,
  },
  groupBasicInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  groupDescription: {
    color: "#666",
    marginVertical: 8,
  },
  groupStats: {
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  primaryButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  membersCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  emptyMembers: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
});
