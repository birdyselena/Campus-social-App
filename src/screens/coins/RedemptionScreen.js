import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Button } from "react-native-paper";

export default function RedemptionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Redeem Coins</Text>
          <Text style={styles.placeholder}>
            This screen will handle:
            {"\n"}• Coin redemption process
            {"\n"}• Discount calculation
            {"\n"}• Payment processing with Stripe
            {"\n"}• Redemption history
            {"\n"}• QR codes for in-store use
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
