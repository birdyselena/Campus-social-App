import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Main Screens
import HomeScreen from "../screens/main/HomeScreen";
import ChatScreen from "../screens/main/ChatScreen";
import EventsScreen from "../screens/main/EventsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import CoinsScreen from "../screens/main/CoinsScreen";

// Chat Screens
import ChatGroupScreen from "../screens/chat/ChatGroupScreen";
import CreateGroupScreen from "../screens/chat/CreateGroupScreen";
import GroupInfoScreen from "../screens/chat/GroupInfoScreen";
import MyGroupsScreen from "../screens/chat/MyGroupsScreen";
import GroupDiscussionScreen from "../screens/chat/GroupDiscussionScreen";
import DiscussionDetailScreen from "../screens/chat/DiscussionDetailScreen";

// Event Screens
import EventDetailsScreen from "../screens/events/EventDetailsScreen";
import CreateEventScreen from "../screens/events/CreateEventScreen";

// Coins Screens
import PartnerBrandsScreen from "../screens/coins/PartnerBrandsScreen";
import RedemptionScreen from "../screens/coins/RedemptionScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbox" : "chatbox-outline";
          } else if (route.name === "Events") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Coins") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6200EE",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Coins" component={CoinsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatGroup"
        component={ChatGroupScreen}
        options={{ title: "Group Chat" }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: "Create Group" }}
      />
      <Stack.Screen
        name="GroupInfo"
        component={GroupInfoScreen}
        options={{ title: "Group Info" }}
      />
      <Stack.Screen
        name="MyGroups"
        component={MyGroupsScreen}
        options={{ title: "My Groups" }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: "Event Details" }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: "Create Event" }}
      />
      <Stack.Screen
        name="PartnerBrands"
        component={PartnerBrandsScreen}
        options={{ title: "Partner Brands" }}
      />
      <Stack.Screen
        name="Redemption"
        component={RedemptionScreen}
        options={{ title: "Redeem Coins" }}
      />
      <Stack.Screen
        name="GroupDiscussion"
        component={GroupDiscussionScreen}
        options={{ title: "Group Discussion" }}
      />
      <Stack.Screen
        name="DiscussionDetail"
        component={DiscussionDetailScreen}
        options={{ title: "Discussion Detail" }}
      />
    </Stack.Navigator>
  );
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can replace this with a loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
