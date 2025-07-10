import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Avatar,
  Chip,
  Searchbar,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { generateAvatarLabel } from "../../utils/avatarHelpers";

export default function PartnerBrandsScreen({ navigation }) {
  const { userProfile, updateCoinsBalance } = useAuth();
  const [brands, setBrands] = useState([]);
  const [offers, setOffers] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    fetchBrandsAndOffers();
  }, []);

  useEffect(() => {
    // Filter brands based on search query
    if (searchQuery) {
      const filtered = brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          brand.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchQuery, brands]);

  const fetchBrandsAndOffers = async () => {
    setLoading(true);
    try {
      // Mock data for demo purposes
      const mockBrands = [
        {
          id: "1",
          name: "Campus Cafe",
          description:
            "Your favorite campus coffee shop with fresh brews and snacks",
          category: "Food & Drink",
          max_discount: 20,
          min_coins_required: 50,
          is_active: true,
          website: "https://campuscafe.com",
        },
        {
          id: "2",
          name: "Study Supplies Store",
          description:
            "All your academic needs in one place - textbooks, stationery, and more",
          category: "Academic",
          max_discount: 15,
          min_coins_required: 75,
          is_active: true,
          website: "https://studysupplies.com",
        },
        {
          id: "3",
          name: "Fitness Center",
          description:
            "Stay healthy with our state-of-the-art gym and fitness classes",
          category: "Health & Fitness",
          max_discount: 25,
          min_coins_required: 100,
          is_active: true,
          website: "https://fitnesscenter.com",
        },
        {
          id: "4",
          name: "Local Pizza",
          description: "Best pizza near campus with student-friendly prices",
          category: "Food & Drink",
          max_discount: 30,
          min_coins_required: 80,
          is_active: true,
          website: "https://localpizza.com",
        },
      ];

      const mockOffers = [
        {
          id: "1",
          brand_id: "1",
          title: "Coffee & Pastry Combo",
          description: "Get 20% off any coffee and pastry combination",
          discount_percentage: 20,
          coins_cost: 50,
          max_redemptions: 100,
          current_redemptions: 23,
          valid_until: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
        },
        {
          id: "2",
          brand_id: "1",
          title: "Free Upgrade",
          description: "Upgrade your coffee size for free",
          discount_percentage: 15,
          coins_cost: 30,
          max_redemptions: 50,
          current_redemptions: 12,
          valid_until: new Date(
            Date.now() + 15 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
        },
        {
          id: "3",
          brand_id: "2",
          title: "Textbook Discount",
          description: "15% off any textbook purchase",
          discount_percentage: 15,
          coins_cost: 75,
          max_redemptions: 200,
          current_redemptions: 45,
          valid_until: new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
        },
        {
          id: "4",
          brand_id: "3",
          title: "Monthly Membership",
          description: "25% off first month gym membership",
          discount_percentage: 25,
          coins_cost: 100,
          max_redemptions: 50,
          current_redemptions: 8,
          valid_until: new Date(
            Date.now() + 45 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
        },
        {
          id: "5",
          brand_id: "4",
          title: "Large Pizza Deal",
          description: "30% off any large pizza order",
          discount_percentage: 30,
          coins_cost: 80,
          max_redemptions: 100,
          current_redemptions: 67,
          valid_until: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
        },
      ];

      setBrands(mockBrands);
      setOffers(mockOffers);
    } catch (error) {
      console.error("Error fetching brands and offers:", error);
      Alert.alert("Error", "Failed to load partner brands");
    }
    setLoading(false);
  };

  const handleRedeem = async (offer) => {
    if (!userProfile) {
      Alert.alert("Error", "Please log in to redeem offers");
      return;
    }

    if (userProfile.coins_balance < offer.coins_cost) {
      Alert.alert(
        "Insufficient Coins",
        `You need ${offer.coins_cost} coins to redeem this offer. You have ${userProfile.coins_balance} coins.`
      );
      return;
    }

    Alert.alert(
      "Confirm Redemption",
      `Redeem "${offer.title}" for ${offer.coins_cost} coins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: () => processRedemption(offer),
        },
      ]
    );
  };

  const processRedemption = async (offer) => {
    setRedeeming(offer.id);
    try {
      // Generate redemption code
      const redemptionCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      // Deduct coins from user balance
      const result = await updateCoinsBalance(
        -offer.coins_cost,
        "redemption",
        `Redeemed: ${offer.title}`
      );

      if (result.error) throw result.error;

      Alert.alert(
        "Redemption Successful!",
        `Your redemption code is: ${redemptionCode}\n\nShow this code at the store to claim your discount.\n\nExpires in 30 days.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error processing redemption:", error);
      Alert.alert("Error", "Failed to process redemption. Please try again.");
    }
    setRedeeming(null);
  };

  const renderBrand = ({ item }) => {
    const brandOffers = offers.filter((offer) => offer.brand_id === item.id);
    const bestOffer = brandOffers.reduce(
      (best, current) =>
        current.discount_percentage > (best?.discount_percentage || 0)
          ? current
          : best,
      null
    );

    return (
      <Card style={styles.brandCard}>
        <Card.Content>
          <View style={styles.brandHeader}>
            <Avatar.Text
              size={60}
              label={generateAvatarLabel(item.name, "B")}
              style={styles.brandAvatar}
            />
            <View style={styles.brandInfo}>
              <Title numberOfLines={1}>{item.name}</Title>
              <Paragraph numberOfLines={2}>{item.description}</Paragraph>
              <View style={styles.brandMeta}>
                {item.category && (
                  <Chip icon="tag" style={styles.categoryChip}>
                    {item.category}
                  </Chip>
                )}
                {bestOffer && (
                  <Chip icon="percent" style={styles.discountChip}>
                    Up to {bestOffer.discount_percentage}% off
                  </Chip>
                )}
              </View>
            </View>
          </View>

          {brandOffers.length > 0 && (
            <View style={styles.offersContainer}>
              <Text style={styles.offersTitle}>Available Offers:</Text>
              {brandOffers.slice(0, 2).map((offer) => (
                <Card key={offer.id} style={styles.offerCard}>
                  <Card.Content style={styles.offerContent}>
                    <View style={styles.offerInfo}>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                      <Text style={styles.offerDescription}>
                        {offer.description}
                      </Text>
                      <View style={styles.offerMeta}>
                        <Chip icon="percent" style={styles.chip}>
                          {offer.discount_percentage}% off
                        </Chip>
                        <Chip icon="wallet" style={styles.chip}>
                          {offer.coins_cost} coins
                        </Chip>
                      </View>
                    </View>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => handleRedeem(offer)}
                      disabled={
                        userProfile?.coins_balance < offer.coins_cost ||
                        redeeming === offer.id
                      }
                      style={styles.redeemButton}
                    >
                      {redeeming === offer.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        "Redeem"
                      )}
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}

          {item.website && (
            <Button
              mode="outlined"
              icon="web"
              onPress={() => {
                /* Open website */
              }}
              style={styles.websiteButton}
            >
              Visit Website
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search brands..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredBrands}
        renderItem={renderBrand}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchBrandsAndOffers}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No partner brands available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new offers and discounts
            </Text>
          </View>
        }
      />

      {/* Coins Balance Footer */}
      <View style={styles.coinsFooter}>
        <Ionicons name="wallet" size={24} color="#FFD700" />
        <Text style={styles.coinsText}>
          Your Balance: {userProfile?.coins_balance || 0} Coins
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  brandCard: {
    marginBottom: 16,
    elevation: 4,
  },
  brandHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  brandAvatar: {
    marginRight: 12,
  },
  brandInfo: {
    flex: 1,
  },
  brandMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  discountChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: "#4CAF50",
  },
  offersContainer: {
    marginTop: 12,
  },
  offersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  offerCard: {
    marginBottom: 8,
    elevation: 1,
  },
  offerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  offerInfo: {
    flex: 1,
    marginRight: 12,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  offerDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  offerMeta: {
    flexDirection: "row",
    marginTop: 6,
  },
  chip: {
    marginRight: 8,
  },
  redeemButton: {
    minWidth: 80,
  },
  websiteButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  coinsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  coinsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
