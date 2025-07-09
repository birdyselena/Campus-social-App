import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Title,
  Card,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const result = await login(email, password);

    if (result.success) {
      // 登录成功，导航会自动处理
    } else {
      Alert.alert("Login Failed", result.error);
    }
    setLoading(false);
  };

  const handleTestLogin = async () => {
    setLoading(true);
    const result = await login("student@university.edu", "password123");

    if (result.success) {
      // 登录成功，导航会自动处理
    } else {
      Alert.alert("Test Login Failed", result.error);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Title style={styles.title}>Campus Social</Title>
          <Text style={styles.subtitle}>
            Connect with your campus community
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : "Login"}
              </Button>

              <Button
                mode="outlined"
                onPress={handleTestLogin}
                style={[styles.button, { marginTop: 10 }]}
                disabled={loading}
              >
                Test Login
              </Button>

              <Button
                mode="outlined"
                onPress={() => {
                  setEmail("student@university.edu");
                  setPassword("password123");
                }}
                style={styles.button}
              >
                Use Test Account
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate("Register")}
                style={styles.linkButton}
              >
                Don't have an account? Sign up
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#6200EE",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
});
