const express = require("express");
const { validateRequest } = require("../middleware/validation");
const { protect } = require("../middleware/auth");
const chatController = require("../controllers/chatController");

const router = express.Router();

// Validation schemas
const createGroupSchema = {
  name: {
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: "Group name must be between 3 and 50 characters",
    },
    trim: true,
  },
  description: {
    isLength: {
      options: { min: 10, max: 500 },
      errorMessage: "Group description must be between 10 and 500 characters",
    },
    trim: true,
  },
  university: {
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "University name must be between 2 and 100 characters",
    },
    trim: true,
  },
  is_private: {
    isBoolean: {
      errorMessage: "is_private must be a boolean value",
    },
  },
  max_members: {
    optional: true,
    isInt: {
      options: { min: 2, max: 1000 },
      errorMessage: "Maximum members must be between 2 and 1000",
    },
  },
};

const updateGroupSchema = {
  name: {
    optional: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: "Group name must be between 3 and 50 characters",
    },
    trim: true,
  },
  description: {
    optional: true,
    isLength: {
      options: { min: 10, max: 500 },
      errorMessage: "Group description must be between 10 and 500 characters",
    },
    trim: true,
  },
  is_private: {
    optional: true,
    isBoolean: {
      errorMessage: "is_private must be a boolean value",
    },
  },
  max_members: {
    optional: true,
    isInt: {
      options: { min: 2, max: 1000 },
      errorMessage: "Maximum members must be between 2 and 1000",
    },
  },
};

const sendMessageSchema = {
  content: {
    isLength: {
      options: { min: 1, max: 1000 },
      errorMessage: "Message content must be between 1 and 1000 characters",
    },
    trim: true,
  },
  message_type: {
    isIn: {
      options: [["text", "image", "file", "system"]],
      errorMessage: "Message type must be text, image, file, or system",
    },
  },
};

// Group routes
router.get("/groups", chatController.getAllGroups);
router.get("/groups/my-groups", protect, chatController.getMyGroups);
router.get("/groups/search", chatController.searchGroups);
router.get("/groups/:id", chatController.getGroupById);
router.post(
  "/groups",
  protect,
  validateRequest(createGroupSchema),
  chatController.createGroup
);
router.put(
  "/groups/:id",
  protect,
  validateRequest(updateGroupSchema),
  chatController.updateGroup
);
router.delete("/groups/:id", protect, chatController.deleteGroup);

// Group membership
router.post("/groups/:id/join", protect, chatController.joinGroup);
router.delete("/groups/:id/leave", protect, chatController.leaveGroup);
router.get("/groups/:id/members", chatController.getGroupMembers);
router.post(
  "/groups/:id/members/:userId/promote",
  protect,
  chatController.promoteToAdmin
);
router.post(
  "/groups/:id/members/:userId/demote",
  protect,
  chatController.demoteFromAdmin
);
router.delete(
  "/groups/:id/members/:userId",
  protect,
  chatController.removeMember
);

// Messages
router.get("/groups/:id/messages", protect, chatController.getGroupMessages);
router.post(
  "/groups/:id/messages",
  protect,
  validateRequest(sendMessageSchema),
  chatController.sendMessage
);
router.put("/messages/:id", protect, chatController.updateMessage);
router.delete("/messages/:id", protect, chatController.deleteMessage);

// Direct messages
router.get("/conversations", protect, chatController.getConversations);
router.get(
  "/conversations/:userId",
  protect,
  chatController.getConversationWithUser
);
router.post(
  "/conversations/:userId/messages",
  protect,
  validateRequest(sendMessageSchema),
  chatController.sendDirectMessage
);

module.exports = router;
