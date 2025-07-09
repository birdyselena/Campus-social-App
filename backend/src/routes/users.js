const express = require("express");
const { validateRequest } = require("../middleware/validation");
const { protect } = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

// Validation schemas
const updateProfileSchema = {
  full_name: {
    optional: true,
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "Full name must be between 2 and 50 characters",
    },
    trim: true,
  },
  bio: {
    optional: true,
    isLength: {
      options: { max: 500 },
      errorMessage: "Bio must be less than 500 characters",
    },
    trim: true,
  },
  university: {
    optional: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "University name must be between 2 and 100 characters",
    },
    trim: true,
  },
  student_id: {
    optional: true,
    isLength: {
      options: { min: 5, max: 20 },
      errorMessage: "Student ID must be between 5 and 20 characters",
    },
    trim: true,
  },
  major: {
    optional: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Major must be between 2 and 100 characters",
    },
    trim: true,
  },
  year: {
    optional: true,
    isInt: {
      options: { min: 1, max: 10 },
      errorMessage: "Year must be between 1 and 10",
    },
  },
  interests: {
    optional: true,
    isArray: {
      errorMessage: "Interests must be an array",
    },
  },
};

const searchUsersSchema = {
  query: {
    optional: true,
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: "Search query must be between 1 and 100 characters",
    },
    trim: true,
  },
  university: {
    optional: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "University name must be between 2 and 100 characters",
    },
    trim: true,
  },
  major: {
    optional: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Major must be between 2 and 100 characters",
    },
    trim: true,
  },
  year: {
    optional: true,
    isInt: {
      options: { min: 1, max: 10 },
      errorMessage: "Year must be between 1 and 10",
    },
  },
};

// Routes
router.get("/profile", protect, userController.getProfile);
router.put(
  "/profile",
  protect,
  validateRequest(updateProfileSchema),
  userController.updateProfile
);
router.delete("/profile", protect, userController.deleteProfile);

router.get(
  "/search",
  validateRequest(searchUsersSchema),
  userController.searchUsers
);
router.get("/stats", protect, userController.getUserStats);
router.get("/activity", protect, userController.getUserActivity);

router.get("/:id", userController.getUserById);
router.get("/:id/public-profile", userController.getPublicProfile);

// Friends/Connections
router.get("/friends", protect, userController.getFriends);
router.post("/friends/:userId", protect, userController.sendFriendRequest);
router.put(
  "/friends/:userId/accept",
  protect,
  userController.acceptFriendRequest
);
router.put(
  "/friends/:userId/reject",
  protect,
  userController.rejectFriendRequest
);
router.delete("/friends/:userId", protect, userController.removeFriend);
router.get("/friends/requests", protect, userController.getFriendRequests);

// Blocking
router.post("/block/:userId", protect, userController.blockUser);
router.delete("/block/:userId", protect, userController.unblockUser);
router.get("/blocked", protect, userController.getBlockedUsers);

// Notifications
router.get("/notifications", protect, userController.getNotifications);
router.put(
  "/notifications/:id/read",
  protect,
  userController.markNotificationAsRead
);
router.put(
  "/notifications/read-all",
  protect,
  userController.markAllNotificationsAsRead
);
router.delete("/notifications/:id", protect, userController.deleteNotification);

// Settings
router.get("/settings", protect, userController.getSettings);
router.put("/settings", protect, userController.updateSettings);

module.exports = router;
