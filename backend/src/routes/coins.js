const express = require("express");
const { validateRequest } = require("../middleware/validation");
const { protect } = require("../middleware/auth");
const coinsController = require("../controllers/coinsController");

const router = express.Router();

// Validation schemas
const transferCoinsSchema = {
  recipient_id: {
    isInt: {
      options: { min: 1 },
      errorMessage: "Recipient ID must be a valid user ID",
    },
  },
  amount: {
    isInt: {
      options: { min: 1, max: 10000 },
      errorMessage: "Amount must be between 1 and 10000",
    },
  },
  description: {
    optional: true,
    isLength: {
      options: { max: 200 },
      errorMessage: "Description must be less than 200 characters",
    },
    trim: true,
  },
};

const redeemOfferSchema = {
  offer_id: {
    isInt: {
      options: { min: 1 },
      errorMessage: "Offer ID must be a valid offer ID",
    },
  },
  quantity: {
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: "Quantity must be between 1 and 100",
    },
  },
};

// Routes
router.get("/balance", protect, coinsController.getBalance);
router.get("/transactions", protect, coinsController.getTransactions);
router.get("/transactions/:id", protect, coinsController.getTransactionById);

// Earning coins
router.post("/earn", protect, coinsController.earnCoins);
router.post("/daily-bonus", protect, coinsController.claimDailyBonus);

// Transferring coins
router.post(
  "/transfer",
  protect,
  validateRequest(transferCoinsSchema),
  coinsController.transferCoins
);

// Redemption offers
router.get("/offers", coinsController.getOffers);
router.get("/offers/:id", coinsController.getOfferById);
router.post(
  "/offers/:id/redeem",
  protect,
  validateRequest(redeemOfferSchema),
  coinsController.redeemOffer
);

// Redemption history
router.get("/redemptions", protect, coinsController.getRedemptions);
router.get("/redemptions/:id", protect, coinsController.getRedemptionById);

// Leaderboard
router.get("/leaderboard", coinsController.getLeaderboard);
router.get(
  "/leaderboard/university/:university",
  coinsController.getUniversityLeaderboard
);

// Statistics
router.get("/stats", protect, coinsController.getCoinsStats);
router.get("/stats/global", coinsController.getGlobalStats);

module.exports = router;
