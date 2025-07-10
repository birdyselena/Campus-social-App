import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Button,
  FAB,
  Chip,
  Avatar,
  ActivityIndicator,
  Surface,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  userStorage,
  getStorageData,
  setStorageData,
} from "../../services/localStorage";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get('window');

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
            name: "Subway",
            description: "15% off on all footlong subs",
            coins_required: 80,
            discount_percentage: 15,
            logo: "🥪",
            category: "Food & Drink",
            expiry_date: "2025-12-31",
            is_active: true,
            website_url: "https://www.subway.com",
            redemption_code: "STUDENT15",
          },
          {
            id: "brand2",
            name: "KFC",
            description: "20% off on family meals",
            coins_required: 100,
            discount_percentage: 20,
            logo: "🍗",
            category: "Food & Drink",
            expiry_date: "2025-12-31",
            is_active: true,
            website_url: "https://www.kfc.com",
            redemption_code: "CAMPUS20",
          },
          {
            id: "brand3",
            name: "Burger King",
            description: "Buy 1 Get 1 Free Whopper",
            coins_required: 120,
            discount_percentage: 50,
            logo: "🍔",
            category: "Food & Drink",
            expiry_date: "2025-12-31",
            is_active: true,
            website_url: "https://www.burgerking.com",
            redemption_code: "BOGO2024",
          },
          {
            id: "brand4",
            name: "Haidilao Hot Pot",
            description: "10% off on all meals",
            coins_required: 150,
            discount_percentage: 10,
            logo: "🍲",
            category: "Food & Drink",
            expiry_date: "2025-12-31",
            is_active: true,
            website_url: "https://www.haidilao.com",
            redemption_code: "HOTPOT10",
          },
          {
            id: "brand5",
            name: "Campus Bookstore",
            description: "25% off on textbooks",
            coins_required: 60,
            discount_percentage: 25,
            logo: "📚",
            category: "Education",
            expiry_date: "2025-12-31",
            is_active: true,
            website_url: "https://www.campusbookstore.com",
            redemption_code: "BOOKS25",
          },
          {
            id: "brand6",
            name: "Tech Zone",
            description: "15% off on electronics",
            coins_required: 200,
            discount_percentage: 15,
            logo: "💻",
            category: "Electronics",
            expiry_date: "2025-12-31",
            is_active: true,
            website_url: "https://www.techzone.com",
            redemption_code: "TECH15",
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

                // Show success message with redemption code and option to visit website
                Alert.alert(
                  "Redemption Successful!",
                  `You have successfully redeemed ${
                    brand.name
                  }!\n\nRedemption Code: ${
                    brand.redemption_code || "N/A"
                  }\nNew Balance: ${
                    updatedUser.coins_balance
                  } coins\n\nWould you like to visit ${
                    brand.name
                  } website to use your discount?`,
                  [
                    { text: "Later", style: "cancel" },
                    {
                      text: "Visit Website",
                      onPress: () => {
                        if (brand.website_url) {
                          Linking.openURL(brand.website_url).catch((err) => {
                            console.error("Failed to open URL:", err);
                            Alert.alert("Error", "Could not open website");
                          });
                        }
                      },
                    },
                  ]
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
    <Surface style={styles.brandCard} elevation={3}>
      <View style={styles.brandContent}>
        <View style={styles.brandHeader}>
          <View style={styles.brandLogoContainer}>
            <Text style={styles.brandLogo}>{item.logo}</Text>
          </View>
          <View style={styles.brandInfo}>
            <Text style={styles.brandName}>{item.name}</Text>
            <Text style={styles.brandDescription}>{item.description}</Text>
          </View>
          <View style={styles.brandRight}>
            <Text style={styles.coinsRequired}>{item.coins_required}</Text>
            <Text style={styles.coinsLabel}>coins</Text>
          </View>
        </View>

        <View style={styles.brandMeta}>
          <View style={styles.brandChips}>
            <Chip
              mode="flat"
              style={styles.categoryChip}
              textStyle={styles.categoryText}
            >
              {item.category}
            </Chip>
            {item.discount_percentage && (
              <Chip
                mode="flat"
                style={styles.discountChip}
                textStyle={styles.discountText}
              >
                {item.discount_percentage}% OFF
              </Chip>
            )}
          </View>
          
          {item.redemption_code && (
            <View style={styles.codeContainer}>
              <MaterialCommunityIcons name="tag" size={16} color="#666" />
              <Text style={styles.redemptionCode}>
                {item.redemption_code}
              </Text>
            </View>
          )}
        </View>

        <Divider style={styles.brandDivider} />

        <View style={styles.brandActions}>
          <View style={styles.coinsStatus}>
            <MaterialCommunityIcons 
              name={coinsBalance >= item.coins_required ? "check-circle" : "alert-circle"} 
              size={16} 
              color={coinsBalance >= item.coins_required ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={[
              styles.coinsStatusText,
              { color: coinsBalance >= item.coins_required ? "#4CAF50" : "#FF9800" }
            ]}>
              {coinsBalance >= item.coins_required ? "Available" : "Need more coins"}
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={() => redeemOffer(item)}
            disabled={coinsBalance < item.coins_required}
            style={[
              styles.redeemButton,
              coinsBalance < item.coins_required && styles.redeemButtonDisabled
            ]}
            contentStyle={styles.redeemButtonContent}
            labelStyle={styles.redeemButtonLabel}
          >
            <MaterialCommunityIcons name="gift" size={16} color="white" />
            {"  "}Redeem
          </Button>
        </View>
      </View>
    </Surface>
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Coins Balance Header */}
      <Surface style={styles.balanceCard} elevation={4}>
        <View style={styles.balanceContent}>
          <View style={styles.balanceLeft}>
            <View style={styles.coinIcon}>
              <MaterialCommunityIcons name="coin" size={40} color="#FFD700" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Your Coins</Text>
              <Text style={styles.balanceAmount}>{coinsBalance}</Text>
              <Text style={styles.balanceSubtext}>Available to redeem</Text>
            </View>
          </View>
          <View style={styles.balanceRight}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#4CAF50" />
          </View>
        </View>
      </Surface>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Surface style={styles.statCard} elevation={2}>
          <MaterialCommunityIcons name="gift" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{partnerBrands.length}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </Surface>
        <Surface style={styles.statCard} elevation={2}>
          <MaterialCommunityIcons name="history" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </Surface>
        <Surface style={styles.statCard} elevation={2}>
          <MaterialCommunityIcons name="star" size={24} color="#9C27B0" />
          <Text style={styles.statNumber}>
            {transactions.filter(t => t.type === 'earn').length}
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </Surface>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "brands" && styles.activeTab]}
          onPress={() => setActiveTab("brands")}
        >
          <MaterialCommunityIcons 
            name="store" 
            size={20} 
            color={activeTab === "brands" ? "#6200EE" : "#666"} 
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "brands" && styles.activeTabText,
            ]}
          >
            Partner Brands
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
          onPress={() => setActiveTab("transactions")}
        >
          <MaterialCommunityIcons 
            name="history" 
            size={20} 
            color={activeTab === "transactions" ? "#6200EE" : "#666"} 
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "transactions" && styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "brands" ? (
        <View style={styles.contentContainer}>
          {partnerBrands.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="store-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No partner brands available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new offers!
              </Text>
            </View>
          ) : (
            partnerBrands.map((brand) => renderBrand({ item: brand }))
          )}
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start earning and spending coins to see your history here!
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => renderTransaction({ item: transaction }))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },

  // Balance Card Styles
  balanceCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#6200EE",
    elevation: 8,
  },
  balanceContent: {
    flexDirection: "row",
    padding: 24,
    alignItems: "center",
  },
  balanceLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  coinIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
  },
  balanceSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  balanceRight: {
    padding: 8,
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  // Tabs Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#6200EE",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginLeft: 8,
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },

  // Content Container
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Brand Card Styles
  brandCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "white",
  },
  brandContent: {
    padding: 20,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  brandLogo: {
    fontSize: 24,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  brandDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  brandRight: {
    alignItems: "flex-end",
  },
  coinsRequired: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200EE",
  },
  coinsLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // Brand Meta Styles
  brandMeta: {
    marginBottom: 16,
  },
  brandChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: "#e3f2fd",
    height: 32,
  },
  categoryText: {
    fontSize: 12,
    color: "#1976d2",
  },
  discountChip: {
    backgroundColor: "#fff3e0",
    height: 32,
  },
  discountText: {
    fontSize: 12,
    color: "#f57c00",
    fontWeight: "bold",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  redemptionCode: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 6,
  },

  brandDivider: {
    marginBottom: 16,
  },

  // Brand Actions
  brandActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coinsStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinsStatusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  redeemButton: {
    borderRadius: 20,
    minWidth: 120,
  },
  redeemButtonDisabled: {
    backgroundColor: "#ccc",
  },
  redeemButtonContent: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  redeemButtonLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },

  // Transaction Card Styles (existing styles)
  transactionCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  transactionDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
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

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
