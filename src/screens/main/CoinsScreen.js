import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Avatar,
  Chip,
  Divider,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

export default function CoinsScreen({ navigation }) {
  const { userProfile, fetchUserProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [partnerBrands, setPartnerBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoinsData();
  }, []);

  const fetchCoinsData = async () => {
    setLoading(true);
    try {
      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from("coins_transactions")
        .select("*")
        .eq("user_id", userProfile?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (transactionsData) {
        setTransactions(transactionsData);
      }

      // Fetch partner brands
      const { data: brandsData } = await supabase
        .from("partner_brands")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (brandsData) {
        setPartnerBrands(brandsData);
      }

      // Refresh user profile to get latest coins balance
      await fetchUserProfile(userProfile?.id);
    } catch (error) {
      console.error("Error fetching coins data:", error);
    }
    setLoading(false);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "daily_checkin":
        return "calendar";
      case "event_attendance":
        return "calendar-check";
      case "chat_participation":
        return "chatbubbles";
      case "redemption":
        return "gift";
      case "bonus":
        return "star";
      default:
        return "wallet";
    }
  };

  const getTransactionColor = (amount) => {
    return amount > 0 ? "#4CAF50" : "#F44336";
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Ionicons
          name={getTransactionIcon(item.transaction_type)}
          size={24}
          color="#6200EE"
          style={styles.transactionIcon}
        />
        <View>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: getTransactionColor(item.amount) },
        ]}
      >
        {item.amount > 0 ? "+" : ""}
        {item.amount}
      </Text>
    </View>
  );

  const renderPartnerBrand = ({ item }) => (
    <Card
      style={styles.brandCard}
      onPress={() => navigation.navigate("PartnerBrands", { brandId: item.id })}
    >
      <Card.Content style={styles.brandContent}>
        <Avatar.Text
          size={60}
          label={item.name.substring(0, 2).toUpperCase()}
          style={styles.brandAvatar}
        />
        <View style={styles.brandInfo}>
          <Title numberOfLines={1}>{item.name}</Title>
          <Paragraph numberOfLines={2}>{item.description}</Paragraph>
          <Chip icon="tag" style={styles.discountChip}>
            Up to {item.max_discount}% off
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchCoinsData} />
      }
    >
      {/* Coins Balance Card */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={48} color="#FFD700" />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceAmount}>
                {userProfile?.coins_balance || 0}
              </Text>
              <Text style={styles.balanceLabel}>Coins Available</Text>
            </View>
          </View>

          <View style={styles.earnOptions}>
            <Text style={styles.earnTitle}>Earn More Coins:</Text>
            <View style={styles.earnMethods}>
              <Chip icon="calendar" style={styles.earnChip}>
                Daily Check-in: +10
              </Chip>
              <Chip icon="calendar-check" style={styles.earnChip}>
                Attend Events: +15
              </Chip>
              <Chip icon="chatbubbles" style={styles.earnChip}>
                Chat Activity: +5
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Partner Brands */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Partner Brands</Title>
            <Button onPress={() => navigation.navigate("PartnerBrands")}>
              View All
            </Button>
          </View>

          <FlatList
            data={partnerBrands.slice(0, 3)}
            renderItem={renderPartnerBrand}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />

          {partnerBrands.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No partner brands available</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Transactions</Title>

          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Divider style={styles.divider} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start earning coins by participating in activities
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="gift"
              onPress={() => navigation.navigate("PartnerBrands")}
              style={styles.actionButton}
            >
              Redeem Coins
            </Button>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => navigation.navigate("Events")}
              style={styles.actionButton}
            >
              Find Events
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
    padding: 16,
  },
  balanceCard: {
    marginBottom: 16,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6200EE",
  },
  balanceLabel: {
    fontSize: 16,
    color: "#666",
  },
  earnOptions: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 8,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  earnMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  earnChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  brandCard: {
    marginBottom: 8,
    elevation: 1,
  },
  brandContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandAvatar: {
    marginRight: 12,
  },
  brandInfo: {
    flex: 1,
  },
  discountChip: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
});
