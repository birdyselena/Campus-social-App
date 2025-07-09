import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  FAB,
  Chip,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  userStorage,
  getStorageData,
  setStorageData,
} from "../../services/localStorage";
import { useFocusEffect } from "@react-navigation/native";

export default function CoinsScreen({ navigation }) {
  const { user } = useAuth();
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [partnerBrands, setPartnerBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("brands"); // 添加标签状态

  useFocusEffect(
    React.useCallback(() => {
      fetchCoinsData();
    }, [])
  );

  const fetchCoinsData = async () => {
    try {
      setLoading(true);

      // 获取用户最新信息
      if (user && user.id) {
        const userProfile = await userStorage.fetchUserProfile(user.id);
        if (userProfile) {
          setCoinsBalance(userProfile.coins_balance || 0);
        }
      }

      // 获取交易记录
      const transactionsData = await getStorageData("coins_transactions");
      const userTransactions = transactionsData.filter(
        (transaction) => transaction.user_id === user?.id
      );
      setTransactions(userTransactions);

      // 获取合作品牌
      const brandsData = await getStorageData("partner_brands");
      if (brandsData.length === 0) {
        // 如果没有数据，创建示例数据
        const sampleBrands = [
          {
            id: "brand1",
            name: "Campus Café",
            description: "20% off on all beverages",
            coins_required: 50,
            discount_percentage: 20,
            logo: "☕",
            category: "Food & Drink",
            expiry_date: "2025-12-31",
            is_active: true,
          },
          {
            id: "brand2",
            name: "Study Supplies",
            description: "15% off on stationery",
            coins_required: 75,
            discount_percentage: 15,
            logo: "📚",
            category: "Education",
            expiry_date: "2025-12-31",
            is_active: true,
          },
          {
            id: "brand3",
            name: "Tech Store",
            description: "10% off on electronics",
            coins_required: 100,
            discount_percentage: 10,
            logo: "💻",
            category: "Electronics",
            expiry_date: "2025-12-31",
            is_active: true,
          },
        ];
        await setStorageData("partner_brands", sampleBrands);
        setPartnerBrands(sampleBrands);
      } else {
        setPartnerBrands(brandsData);
      }
    } catch (error) {
      console.error("Error fetching coins data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoinsData();
  };

  const redeemOffer = async (brand) => {
    if (!user || !user.id) {
      Alert.alert("Error", "Please log in to redeem offers");
      return;
    }

    if (coinsBalance < brand.coins_required) {
      Alert.alert(
        "Insufficient Coins",
        `You need ${brand.coins_required} coins to redeem this offer. You have ${coinsBalance} coins.`
      );
      return;
    }

    Alert.alert(
      "Confirm Redemption",
      `Are you sure you want to redeem "${brand.name}" for ${brand.coins_required} coins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            try {
              // 扣除用户金币
              const updatedUser = await userStorage.updateUserCoins(
                user.id,
                -brand.coins_required
              );

              if (updatedUser) {
                setCoinsBalance(updatedUser.coins_balance);

                // 创建交易记录
                const transactionData = {
                  id:
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 9),
                  user_id: user.id,
                  type: "redeem",
                  amount: -brand.coins_required,
                  description: `Redeemed: ${brand.name}`,
                  brand_id: brand.id,
                  created_at: new Date().toISOString(),
                };

                const allTransactions = await getStorageData(
                  "coins_transactions"
                );
                allTransactions.push(transactionData);
                await setStorageData("coins_transactions", allTransactions);

                Alert.alert(
                  "Success!",
                  `You have successfully redeemed ${brand.name}. Your new balance is ${updatedUser.coins_balance} coins.`
                );

                fetchCoinsData(); // 刷新数据
              }
            } catch (error) {
              console.error("Error redeeming offer:", error);
              Alert.alert("Error", "Failed to redeem offer. Please try again.");
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <Card.Content>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {item.type === "earn" ? "Earned" : "Redeemed"}
            </Text>
            <Text style={styles.transactionDescription}>
              {item.description}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              item.type === "earn" ? styles.earnAmount : styles.redeemAmount,
            ]}
          >
            {item.type === "earn" ? "+" : ""}
            {item.amount}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderBrand = ({ item }) => (
    <Card style={styles.brandCard}>
      <Card.Content>
        <View style={styles.brandHeader}>
          <Text style={styles.brandLogo}>{item.logo}</Text>
          <View style={styles.brandInfo}>
            <Text style={styles.brandName}>{item.name}</Text>
            <Text style={styles.brandDescription}>{item.description}</Text>
            <Chip
              mode="outlined"
              style={styles.categoryChip}
              textStyle={styles.categoryText}
            >
              {item.category}
            </Chip>
          </View>
        </View>
        <View style={styles.brandActions}>
          <Text style={styles.coinsRequired}>{item.coins_required} coins</Text>
          <Button
            mode="contained"
            onPress={() => redeemOffer(item)}
            disabled={coinsBalance < item.coins_required}
            style={styles.redeemButton}
          >
            Redeem
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading coins data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Coins Balance Header */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <View style={styles.balanceHeader}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Your Coins</Text>
              <Text style={styles.balanceAmount}>{coinsBalance}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "brands" && styles.activeTab]}
          onPress={() => setActiveTab("brands")}
        >
          <Text style={[styles.tabText, activeTab === "brands" && styles.activeTabText]}>
            Partner Brands
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
          onPress={() => setActiveTab("transactions")}
        >
          <Text style={[styles.tabText, activeTab === "transactions" && styles.activeTabText]}>
            Transaction History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Partner Brands List */}
      {activeTab === "brands" && (
        <FlatList
          data={partnerBrands}
          renderItem={renderBrand}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No partner brands available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new offers!
              </Text>
            </View>
          }
        />
      )}

      {/* Transaction History List */}
      {activeTab === "transactions" && (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start earning and spending coins!
              </Text>
            </View>
          }
        />
      )}

      {/* FAB for earning coins */}
      <FAB
        icon="plus"
        label="Earn Coins"
        style={styles.fab}
        onPress={() => {
          Alert.alert(
            "Earn Coins",
            "Ways to earn coins:\n• Attend events\n• Complete profile\n• Invite friends\n• Participate in activities",
            [{ text: "OK" }]
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  balanceCard: {
    margin: 16,
    elevation: 4,
    backgroundColor: "#6200EE",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceInfo: {
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: "white",
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#6200EE",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  brandCard: {
    marginBottom: 12,
    elevation: 2,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  brandLogo: {
    fontSize: 32,
    marginRight: 16,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brandDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 12,
  },
  brandActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coinsRequired: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200EE",
  },
  redeemButton: {
    minWidth: 100,
  },
  transactionCard: {
    marginBottom: 8,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 10,
    color: "#999",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  earnAmount: {
    color: "#4CAF50",
  },
  redeemAmount: {
    color: "#F44336",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6200EE",
  },
});
