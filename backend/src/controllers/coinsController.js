const { User, CoinsTransaction } = require("../models");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const {
  createResponse,
  paginate,
  getPaginationMeta,
  calculateCoins,
} = require("../utils/helpers");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

const coinsController = {
  // Get user's coin balance
  getBalance: catchAsync(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "coins_balance",
        "total_coins_earned",
        "total_coins_spent",
      ],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json(
      createResponse("success", "Balance retrieved successfully", {
        balance: user.coins_balance,
        totalEarned: user.total_coins_earned || 0,
        totalSpent: user.total_coins_spent || 0,
      })
    );
  }),

  // Get user's coin transactions
  getTransactions: catchAsync(async (req, res) => {
    const { page = 1, limit = 20, type, date_from, date_to } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    let whereClause = { user_id: req.user.id };

    if (type) {
      whereClause.transaction_type = type;
    }

    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }

    const { count, rows: transactions } =
      await CoinsTransaction.findAndCountAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        limit: queryLimit,
        offset,
      });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Transactions retrieved successfully",
        transactions,
        meta
      )
    );
  }),

  // Get transaction by ID
  getTransactionById: catchAsync(async (req, res) => {
    const { id } = req.params;

    const transaction = await CoinsTransaction.findOne({
      where: {
        id,
        user_id: req.user.id,
      },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    res.json(
      createResponse(
        "success",
        "Transaction retrieved successfully",
        transaction
      )
    );
  }),

  // Earn coins for activity
  earnCoins: catchAsync(async (req, res) => {
    const { activity_type, reference_id, description } = req.body;

    // Validate activity type
    const validActivityTypes = [
      "daily_login",
      "event_create",
      "event_attend",
      "group_create",
      "message_send",
      "profile_complete",
      "referral",
    ];

    if (!validActivityTypes.includes(activity_type)) {
      throw new AppError("Invalid activity type", 400);
    }

    // Check for duplicate transactions for certain activities
    if (["daily_login", "profile_complete"].includes(activity_type)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingTransaction = await CoinsTransaction.findOne({
        where: {
          user_id: req.user.id,
          transaction_type: activity_type,
          created_at: { [Op.gte]: today },
        },
      });

      if (existingTransaction) {
        throw new AppError(
          "You have already earned coins for this activity today",
          400
        );
      }
    }

    const coinAmount = calculateCoins(activity_type);

    if (coinAmount <= 0) {
      throw new AppError("No coins available for this activity", 400);
    }

    // Create transaction
    const transaction = await CoinsTransaction.create({
      user_id: req.user.id,
      amount: coinAmount,
      transaction_type: activity_type,
      description: description || `Earned coins for ${activity_type}`,
      reference_id,
    });

    // Update user's coin balance
    await User.increment("coins_balance", {
      by: coinAmount,
      where: { id: req.user.id },
    });
    await User.increment("total_coins_earned", {
      by: coinAmount,
      where: { id: req.user.id },
    });

    logger.info(
      `User ${req.user.id} earned ${coinAmount} coins for ${activity_type}`
    );

    res.json(
      createResponse("success", "Coins earned successfully", {
        amount: coinAmount,
        transaction,
      })
    );
  }),

  // Claim daily bonus
  claimDailyBonus: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has already claimed today
    const existingClaim = await CoinsTransaction.findOne({
      where: {
        user_id: userId,
        transaction_type: "daily_bonus",
        created_at: { [Op.gte]: today },
      },
    });

    if (existingClaim) {
      throw new AppError("Daily bonus already claimed today", 400);
    }

    // Calculate consecutive days and bonus amount
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayBonus = await CoinsTransaction.findOne({
      where: {
        user_id: userId,
        transaction_type: "daily_bonus",
        created_at: { [Op.gte]: yesterday, [Op.lt]: today },
      },
    });

    let consecutiveDays = 1;
    if (yesterdayBonus) {
      // Get current streak from user data or calculate
      consecutiveDays = (req.user.daily_streak || 0) + 1;
    }

    // Calculate bonus amount (base 10 + streak bonus)
    const baseAmount = 10;
    const streakBonus = Math.min(consecutiveDays - 1, 7) * 5; // Max 7 days bonus
    const totalAmount = baseAmount + streakBonus;

    // Create transaction
    const transaction = await CoinsTransaction.create({
      user_id: userId,
      amount: totalAmount,
      transaction_type: "daily_bonus",
      description: `Daily bonus (${consecutiveDays} days streak)`,
    });

    // Update user's coin balance and streak
    await User.increment("coins_balance", {
      by: totalAmount,
      where: { id: userId },
    });
    await User.increment("total_coins_earned", {
      by: totalAmount,
      where: { id: userId },
    });
    await User.update(
      { daily_streak: consecutiveDays },
      { where: { id: userId } }
    );

    logger.info(
      `User ${userId} claimed daily bonus: ${totalAmount} coins (${consecutiveDays} days streak)`
    );

    res.json(
      createResponse("success", "Daily bonus claimed successfully", {
        amount: totalAmount,
        streak: consecutiveDays,
        transaction,
      })
    );
  }),

  // Transfer coins to another user
  transferCoins: catchAsync(async (req, res) => {
    const { recipient_id, amount, description } = req.body;
    const senderId = req.user.id;

    if (senderId === recipient_id) {
      throw new AppError("Cannot transfer coins to yourself", 400);
    }

    // Check if recipient exists
    const recipient = await User.findByPk(recipient_id);
    if (!recipient) {
      throw new AppError("Recipient not found", 404);
    }

    // Check if sender has enough coins
    const sender = await User.findByPk(senderId);
    if (sender.coins_balance < amount) {
      throw new AppError("Insufficient coin balance", 400);
    }

    // Create transactions using a database transaction
    const { sequelize } = require("../models");
    const t = await sequelize.transaction();

    try {
      // Create sender transaction (negative amount)
      await CoinsTransaction.create(
        {
          user_id: senderId,
          amount: -amount,
          transaction_type: "transfer_out",
          description: description || `Transferred to ${recipient.full_name}`,
          reference_id: recipient_id,
        },
        { transaction: t }
      );

      // Create recipient transaction (positive amount)
      await CoinsTransaction.create(
        {
          user_id: recipient_id,
          amount: amount,
          transaction_type: "transfer_in",
          description: description || `Received from ${sender.full_name}`,
          reference_id: senderId,
        },
        { transaction: t }
      );

      // Update balances
      await User.decrement(
        "coins_balance",
        { by: amount, where: { id: senderId } },
        { transaction: t }
      );
      await User.increment(
        "coins_balance",
        { by: amount, where: { id: recipient_id } },
        { transaction: t }
      );
      await User.increment(
        "total_coins_spent",
        { by: amount, where: { id: senderId } },
        { transaction: t }
      );

      await t.commit();

      logger.info(
        `User ${senderId} transferred ${amount} coins to user ${recipient_id}`
      );

      res.json(
        createResponse("success", "Coins transferred successfully", {
          amount,
          recipient: {
            id: recipient.id,
            name: recipient.full_name,
          },
        })
      );
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }),

  // Get available offers
  getOffers: catchAsync(async (req, res) => {
    // This would require a separate PartnerOffers model
    // For now, we'll return mock data
    const mockOffers = [
      {
        id: 1,
        title: "Coffee Shop Discount",
        description: "20% off at Campus Coffee",
        coin_cost: 50,
        partner_name: "Campus Coffee",
        category: "food_beverage",
        is_active: true,
      },
      {
        id: 2,
        title: "Bookstore Voucher",
        description: "$10 off textbooks",
        coin_cost: 100,
        partner_name: "University Bookstore",
        category: "education",
        is_active: true,
      },
      {
        id: 3,
        title: "Movie Ticket",
        description: "Free movie ticket",
        coin_cost: 200,
        partner_name: "Cinema Complex",
        category: "entertainment",
        is_active: true,
      },
    ];

    res.json(
      createResponse("success", "Offers retrieved successfully", mockOffers)
    );
  }),

  // Get offer by ID
  getOfferById: catchAsync(async (req, res) => {
    const { id } = req.params;

    // Mock offer data
    const mockOffer = {
      id: parseInt(id),
      title: "Coffee Shop Discount",
      description: "20% off at Campus Coffee",
      coin_cost: 50,
      partner_name: "Campus Coffee",
      category: "food_beverage",
      is_active: true,
      terms_conditions:
        "Valid for 30 days from redemption date. Cannot be combined with other offers.",
    };

    res.json(
      createResponse("success", "Offer retrieved successfully", mockOffer)
    );
  }),

  // Redeem offer
  redeemOffer: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { quantity = 1 } = req.body;
    const userId = req.user.id;

    // Mock offer data (in real app, this would be fetched from database)
    const mockOffer = {
      id: parseInt(id),
      title: "Coffee Shop Discount",
      coin_cost: 50,
      is_active: true,
    };

    if (!mockOffer.is_active) {
      throw new AppError("Offer is not available", 400);
    }

    const totalCost = mockOffer.coin_cost * quantity;

    // Check if user has enough coins
    const user = await User.findByPk(userId);
    if (user.coins_balance < totalCost) {
      throw new AppError("Insufficient coin balance", 400);
    }

    // Create redemption transaction
    const transaction = await CoinsTransaction.create({
      user_id: userId,
      amount: -totalCost,
      transaction_type: "redemption",
      description: `Redeemed: ${mockOffer.title} (x${quantity})`,
      reference_id: id,
    });

    // Update user's coin balance
    await User.decrement("coins_balance", {
      by: totalCost,
      where: { id: userId },
    });
    await User.increment("total_coins_spent", {
      by: totalCost,
      where: { id: userId },
    });

    logger.info(`User ${userId} redeemed offer ${id} for ${totalCost} coins`);

    res.json(
      createResponse("success", "Offer redeemed successfully", {
        offer: mockOffer,
        quantity,
        totalCost,
        transaction,
      })
    );
  }),

  // Get user's redemption history
  getRedemptions: catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: redemptions } = await CoinsTransaction.findAndCountAll(
      {
        where: {
          user_id: req.user.id,
          transaction_type: "redemption",
        },
        order: [["created_at", "DESC"]],
        limit: queryLimit,
        offset,
      }
    );

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Redemptions retrieved successfully",
        redemptions,
        meta
      )
    );
  }),

  // Get redemption by ID
  getRedemptionById: catchAsync(async (req, res) => {
    const { id } = req.params;

    const redemption = await CoinsTransaction.findOne({
      where: {
        id,
        user_id: req.user.id,
        transaction_type: "redemption",
      },
    });

    if (!redemption) {
      throw new AppError("Redemption not found", 404);
    }

    res.json(
      createResponse("success", "Redemption retrieved successfully", redemption)
    );
  }),

  // Get coins leaderboard
  getLeaderboard: catchAsync(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        is_active: true,
        is_verified: true,
      },
      attributes: [
        "id",
        "full_name",
        "university",
        "coins_balance",
        "total_coins_earned",
        "profile_picture",
      ],
      order: [["coins_balance", "DESC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Leaderboard retrieved successfully",
        users,
        meta
      )
    );
  }),

  // Get university leaderboard
  getUniversityLeaderboard: catchAsync(async (req, res) => {
    const { university } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        university: { [Op.iLike]: `%${university}%` },
        is_active: true,
        is_verified: true,
      },
      attributes: [
        "id",
        "full_name",
        "university",
        "coins_balance",
        "total_coins_earned",
        "profile_picture",
      ],
      order: [["coins_balance", "DESC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "University leaderboard retrieved successfully",
        users,
        meta
      )
    );
  }),

  // Get user's coin statistics
  getCoinsStats: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const [
      totalEarned,
      totalSpent,
      transactionCount,
      mostUsedActivity,
      dailyStreak,
    ] = await Promise.all([
      CoinsTransaction.sum("amount", {
        where: { user_id: userId, amount: { [Op.gt]: 0 } },
      }) || 0,
      CoinsTransaction.sum("amount", {
        where: { user_id: userId, amount: { [Op.lt]: 0 } },
      }) || 0,
      CoinsTransaction.count({ where: { user_id: userId } }),
      CoinsTransaction.findOne({
        where: { user_id: userId },
        attributes: [
          "transaction_type",
          [
            require("sequelize").fn(
              "COUNT",
              require("sequelize").col("transaction_type")
            ),
            "count",
          ],
        ],
        group: ["transaction_type"],
        order: [
          [
            require("sequelize").fn(
              "COUNT",
              require("sequelize").col("transaction_type")
            ),
            "DESC",
          ],
        ],
      }),
      User.findByPk(userId, { attributes: ["daily_streak"] }),
    ]);

    const stats = {
      totalEarned,
      totalSpent: Math.abs(totalSpent),
      transactionCount,
      mostUsedActivity: mostUsedActivity?.transaction_type || "N/A",
      dailyStreak: dailyStreak?.daily_streak || 0,
    };

    res.json(
      createResponse("success", "Coin statistics retrieved successfully", stats)
    );
  }),

  // Get global statistics
  getGlobalStats: catchAsync(async (req, res) => {
    const [totalUsers, totalCoinsCirculated, totalTransactions, topUniversity] =
      await Promise.all([
        User.count({ where: { is_active: true } }),
        CoinsTransaction.sum("amount", { where: { amount: { [Op.gt]: 0 } } }) ||
          0,
        CoinsTransaction.count(),
        User.findOne({
          attributes: [
            "university",
            [
              require("sequelize").fn(
                "COUNT",
                require("sequelize").col("university")
              ),
              "count",
            ],
          ],
          where: { is_active: true },
          group: ["university"],
          order: [
            [
              require("sequelize").fn(
                "COUNT",
                require("sequelize").col("university")
              ),
              "DESC",
            ],
          ],
        }),
      ]);

    const stats = {
      totalUsers,
      totalCoinsCirculated,
      totalTransactions,
      topUniversity: topUniversity?.university || "N/A",
    };

    res.json(
      createResponse(
        "success",
        "Global statistics retrieved successfully",
        stats
      )
    );
  }),
};

module.exports = coinsController;
