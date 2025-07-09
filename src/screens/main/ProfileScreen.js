import React, { useState } from "react";
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
  Switch,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const profileStats = [
    {
      label: "Coins Balance",
      value: userProfile?.coins_balance || 0,
      icon: "wallet",
      color: "#FFD700",
    },
    {
      label: "Events Attended",
      value: "12", // This would come from a query
      icon: "calendar",
      color: "#4CAF50",
    },
    {
      label: "Groups Joined",
      value: "5", // This would come from a query
      icon: "account-outline",
      color: "#2196F3",
    },
    {
      label: "Days Active",
      value: "30", // This would come from a query
      icon: "analytics",
      color: "#FF5722",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={userProfile?.full_name?.substring(0, 2) || "U"}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.name}>{userProfile?.full_name || "Unknown User"}</Title>
            <Paragraph style={styles.email}>{user?.email || "No email"}</Paragraph>
            <Text style={styles.university}>{userProfile?.university || "No university"}</Text>
            <Text style={styles.studentId}>ID: {userProfile?.student_id || "No ID"}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Grid */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Your Stats</Title>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.actionGrid}>
            <Button
              mode="contained"
              icon="pencil"
              onPress={() => {
                /* Navigate to edit profile */
              }}
              style={styles.actionButton}
            >
              Edit Profile
            </Button>
            <Button
              mode="outlined"
              icon="wallet"
              onPress={() => navigation.navigate("Coins")}
              style={styles.actionButton}
            >
              My Coins
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Settings</Title>

          <List.Item
            title="Notifications"
            description="Receive push notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch value={notifications} onValueChange={setNotifications} />
            )}
          />

          <Divider />

          <List.Item
            title="Public Profile"
            description="Make your profile visible to other students"
            left={(props) => <List.Icon {...props} icon="account" />}
            right={() => (
              <Switch value={publicProfile} onValueChange={setPublicProfile} />
            )}
          />

          <Divider />

          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to privacy policy */
            }}
          />

          <Divider />

          <List.Item
            title="Terms of Service"
            description="Read our terms of service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to terms */
            }}
          />

          <Divider />

          <List.Item
            title="Help & Support"
            description="Get help or contact support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to help */
            }}
          />
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account</Title>

          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to change password */
            }}
          />

          <Divider />

          <List.Item
            title="Delete Account"
            description="Permanently delete your account"
            left={(props) => (
              <List.Icon {...props} icon="delete" color="#F44336" />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "This action cannot be undone. Are you sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive" },
                ]
              );
            }}
          />
        </Card.Content>
      </Card>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor="#F44336"
        >
          Sign Out
        </Button>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Campus Social v1.0.0</Text>
        <Text style={styles.appInfoText}>Made with ❤️ for students</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  email: {
    color: "#666",
    marginBottom: 2,
  },
  university: {
    color: "#6200EE",
    fontWeight: "500",
    marginBottom: 2,
  },
  studentId: {
    color: "#999",
    fontSize: 12,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    width: "22%",
    marginVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  signOutContainer: {
    marginVertical: 24,
    paddingHorizontal: 32,
  },
  signOutButton: {
    borderColor: "#F44336",
  },
  appInfo: {
    alignItems: "center",
    paddingBottom: 32,
  },
  appInfoText: {
    color: "#999",
    fontSize: 12,
    marginBottom: 4,
  },
});
