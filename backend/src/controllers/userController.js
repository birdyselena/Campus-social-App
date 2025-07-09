const {
  User,
  Event,
  ChatGroup,
  ChatGroupMember,
  EventAttendee,
  CoinsTransaction,
} = require("../models");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const {
  createResponse,
  paginate,
  getPaginationMeta,
} = require("../utils/helpers");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

const userController = {
  // Get current user profile
  getProfile: catchAsync(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json(createResponse("success", "Profile retrieved successfully", user));
  }),

  // Update user profile
  updateProfile: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated here
    delete updateData.password;
    delete updateData.email;
    delete updateData.is_verified;
    delete updateData.coins_balance;

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    logger.info(`User profile updated: ${userId}`);

    res.json(
      createResponse("success", "Profile updated successfully", updatedUser)
    );
  }),

  // Delete user profile
  deleteProfile: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Soft delete - mark as deleted but keep data
    await user.update({
      is_active: false,
      deleted_at: new Date(),
      email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
    });

    logger.info(`User profile deleted: ${userId}`);

    res.json(createResponse("success", "Profile deleted successfully"));
  }),

  // Search users
  searchUsers: catchAsync(async (req, res) => {
    const { query, university, major, year, page = 1, limit = 20 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    let whereClause = {
      is_active: true,
      is_verified: true,
    };

    if (query) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
        { student_id: { [Op.iLike]: `%${query}%` } },
      ];
    }

    if (university) {
      whereClause.university = { [Op.iLike]: `%${university}%` };
    }

    if (major) {
      whereClause.major = { [Op.iLike]: `%${major}%` };
    }

    if (year) {
      whereClause.year = year;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "full_name",
        "university",
        "major",
        "year",
        "profile_picture",
        "bio",
      ],
      order: [["full_name", "ASC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse("success", "Users retrieved successfully", users, meta)
    );
  }),

  // Get user statistics
  getUserStats: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const [
      eventsCreated,
      eventsAttended,
      groupsCreated,
      groupsJoined,
      totalCoinsEarned,
      messagesCount,
    ] = await Promise.all([
      Event.count({ where: { creator_id: userId } }),
      EventAttendee.count({ where: { user_id: userId } }),
      ChatGroup.count({ where: { creator_id: userId } }),
      ChatGroupMember.count({ where: { user_id: userId } }),
      CoinsTransaction.sum("amount", {
        where: { user_id: userId, amount: { [Op.gt]: 0 } },
      }) || 0,
      // Message.count({ where: { sender_id: userId } }) // Uncomment when Message model includes sender_id
      0,
    ]);

    const stats = {
      eventsCreated,
      eventsAttended,
      groupsCreated,
      groupsJoined,
      totalCoinsEarned,
      messagesCount,
    };

    res.json(
      createResponse("success", "User statistics retrieved successfully", stats)
    );
  }),

  // Get user activity
  getUserActivity: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: activities } = await CoinsTransaction.findAndCountAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "User activity retrieved successfully",
        activities,
        meta
      )
    );
  }),

  // Get user by ID
  getUserById: catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "full_name",
        "university",
        "major",
        "year",
        "profile_picture",
        "bio",
        "created_at",
      ],
      where: { is_active: true, is_verified: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json(createResponse("success", "User retrieved successfully", user));
  }),

  // Get public profile
  getPublicProfile: catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "full_name",
        "university",
        "major",
        "year",
        "profile_picture",
        "bio",
        "created_at",
      ],
      where: { is_active: true, is_verified: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Get public statistics
    const [eventsCreated, groupsCreated] = await Promise.all([
      Event.count({ where: { creator_id: id } }),
      ChatGroup.count({ where: { creator_id: id } }),
    ]);

    const publicProfile = {
      ...user.toJSON(),
      stats: {
        eventsCreated,
        groupsCreated,
      },
    };

    res.json(
      createResponse(
        "success",
        "Public profile retrieved successfully",
        publicProfile
      )
    );
  }),

  // Get friends
  getFriends: catchAsync(async (req, res) => {
    // This would require a separate Friends model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Friends retrieved successfully", []));
  }),

  // Send friend request
  sendFriendRequest: catchAsync(async (req, res) => {
    // This would require a separate Friends model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Friend request sent successfully"));
  }),

  // Accept friend request
  acceptFriendRequest: catchAsync(async (req, res) => {
    // This would require a separate Friends model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Friend request accepted successfully"));
  }),

  // Reject friend request
  rejectFriendRequest: catchAsync(async (req, res) => {
    // This would require a separate Friends model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Friend request rejected successfully"));
  }),

  // Remove friend
  removeFriend: catchAsync(async (req, res) => {
    // This would require a separate Friends model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Friend removed successfully"));
  }),

  // Get friend requests
  getFriendRequests: catchAsync(async (req, res) => {
    // This would require a separate Friends model
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Friend requests retrieved successfully", [])
    );
  }),

  // Block user
  blockUser: catchAsync(async (req, res) => {
    // This would require a separate BlockedUsers model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "User blocked successfully"));
  }),

  // Unblock user
  unblockUser: catchAsync(async (req, res) => {
    // This would require a separate BlockedUsers model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "User unblocked successfully"));
  }),

  // Get blocked users
  getBlockedUsers: catchAsync(async (req, res) => {
    // This would require a separate BlockedUsers model
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Blocked users retrieved successfully", [])
    );
  }),

  // Get notifications
  getNotifications: catchAsync(async (req, res) => {
    // This would require a separate Notifications model
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Notifications retrieved successfully", [])
    );
  }),

  // Mark notification as read
  markNotificationAsRead: catchAsync(async (req, res) => {
    // This would require a separate Notifications model
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Notification marked as read successfully")
    );
  }),

  // Mark all notifications as read
  markAllNotificationsAsRead: catchAsync(async (req, res) => {
    // This would require a separate Notifications model
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "All notifications marked as read successfully")
    );
  }),

  // Delete notification
  deleteNotification: catchAsync(async (req, res) => {
    // This would require a separate Notifications model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Notification deleted successfully"));
  }),

  // Get user settings
  getSettings: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "email_notifications",
        "push_notifications",
        "privacy_settings",
      ],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const settings = {
      email_notifications: user.email_notifications || true,
      push_notifications: user.push_notifications || true,
      privacy_settings: user.privacy_settings || {
        profile_visibility: "public",
        show_email: false,
        show_student_id: false,
      },
    };

    res.json(
      createResponse("success", "Settings retrieved successfully", settings)
    );
  }),

  // Update user settings
  updateSettings: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { email_notifications, push_notifications, privacy_settings } =
      req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updateData = {};

    if (email_notifications !== undefined) {
      updateData.email_notifications = email_notifications;
    }

    if (push_notifications !== undefined) {
      updateData.push_notifications = push_notifications;
    }

    if (privacy_settings !== undefined) {
      updateData.privacy_settings = privacy_settings;
    }

    await user.update(updateData);

    logger.info(`User settings updated: ${userId}`);

    res.json(createResponse("success", "Settings updated successfully"));
  }),
};

module.exports = userController;
