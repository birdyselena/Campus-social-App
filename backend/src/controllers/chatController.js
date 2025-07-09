const {
  ChatGroup,
  User,
  ChatGroupMember,
  Message,
  CoinsTransaction,
} = require("../models");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const {
  createResponse,
  paginate,
  getPaginationMeta,
  calculateCoins,
} = require("../utils/helpers");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

const chatController = {
  // Get all chat groups with pagination and filtering
  getAllGroups: catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      university,
      search,
      sortBy = "created_at",
      order = "DESC",
    } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    let whereClause = {
      is_private: false, // Only show public groups
    };

    if (university) {
      whereClause.university = { [Op.iLike]: `%${university}%` };
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: groups } = await ChatGroup.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
        {
          model: ChatGroupMember,
          as: "members",
          attributes: ["id", "user_id", "role"],
        },
      ],
      order: [[sortBy, order.toUpperCase()]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Chat groups retrieved successfully",
        groups,
        meta
      )
    );
  }),

  // Get user's groups
  getMyGroups: catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: membershipData } =
      await ChatGroupMember.findAndCountAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: ChatGroup,
            include: [
              {
                model: User,
                as: "creator",
                attributes: ["id", "full_name", "university"],
              },
              {
                model: ChatGroupMember,
                as: "members",
                attributes: ["id", "user_id", "role"],
              },
            ],
          },
        ],
        order: [["joined_at", "DESC"]],
        limit: queryLimit,
        offset,
      });

    const groups = membershipData.map((membership) => membership.ChatGroup);
    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Your groups retrieved successfully",
        groups,
        meta
      )
    );
  }),

  // Search groups
  searchGroups: catchAsync(async (req, res) => {
    const { q, university, page = 1, limit = 10 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    if (!q) {
      throw new AppError("Search query is required", 400);
    }

    let whereClause = {
      is_private: false,
      [Op.or]: [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ],
    };

    if (university) {
      whereClause.university = { [Op.iLike]: `%${university}%` };
    }

    const { count, rows: groups } = await ChatGroup.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
        {
          model: ChatGroupMember,
          as: "members",
          attributes: ["id", "user_id", "role"],
        },
      ],
      order: [["member_count", "DESC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Search results retrieved successfully",
        groups,
        meta
      )
    );
  }),

  // Get group by ID
  getGroupById: catchAsync(async (req, res) => {
    const { id } = req.params;

    const group = await ChatGroup.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university", "profile_picture"],
        },
        {
          model: ChatGroupMember,
          as: "members",
          include: [
            {
              model: User,
              attributes: ["id", "full_name", "university", "profile_picture"],
            },
          ],
        },
      ],
    });

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Check if group is private and user is not a member
    if (group.is_private && req.user) {
      const isMember = await ChatGroupMember.findOne({
        where: {
          group_id: id,
          user_id: req.user.id,
        },
      });

      if (!isMember) {
        throw new AppError("You do not have access to this private group", 403);
      }
    }

    res.json(createResponse("success", "Group retrieved successfully", group));
  }),

  // Create new group
  createGroup: catchAsync(async (req, res) => {
    const groupData = {
      ...req.body,
      creator_id: req.user.id,
      member_count: 1, // Creator is the first member
    };

    const group = await ChatGroup.create(groupData);

    // Add creator as admin member
    await ChatGroupMember.create({
      group_id: group.id,
      user_id: req.user.id,
      role: "admin",
    });

    // Award coins for creating a group
    const coinAmount = calculateCoins("group_create");
    await CoinsTransaction.create({
      user_id: req.user.id,
      amount: coinAmount,
      transaction_type: "group_create",
      description: `Created group: ${group.name}`,
      reference_id: group.id,
    });

    // Update user's coin balance
    await User.increment("coins_balance", {
      by: coinAmount,
      where: { id: req.user.id },
    });

    const createdGroup = await ChatGroup.findByPk(group.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
      ],
    });

    logger.info(`Group created: ${group.name} by user ${req.user.id}`);

    res
      .status(201)
      .json(
        createResponse("success", "Group created successfully", createdGroup)
      );
  }),

  // Update group
  updateGroup: catchAsync(async (req, res) => {
    const { id } = req.params;

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Check if user is admin
    const membership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
        role: "admin",
      },
    });

    if (!membership) {
      throw new AppError("You must be an admin to update this group", 403);
    }

    await group.update(req.body);

    const updatedGroup = await ChatGroup.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
      ],
    });

    logger.info(`Group updated: ${group.name} by user ${req.user.id}`);

    res.json(
      createResponse("success", "Group updated successfully", updatedGroup)
    );
  }),

  // Delete group
  deleteGroup: catchAsync(async (req, res) => {
    const { id } = req.params;

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Only creator can delete the group
    if (group.creator_id !== req.user.id) {
      throw new AppError("Only the creator can delete this group", 403);
    }

    await group.destroy();

    logger.info(`Group deleted: ${group.name} by user ${req.user.id}`);

    res.json(createResponse("success", "Group deleted successfully"));
  }),

  // Join group
  joinGroup: catchAsync(async (req, res) => {
    const { id } = req.params;

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Check if user is already a member
    const existingMembership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
      },
    });

    if (existingMembership) {
      throw new AppError("You are already a member of this group", 400);
    }

    // Check if group is full
    if (group.member_count >= group.max_members) {
      throw new AppError("Group is full", 400);
    }

    await ChatGroupMember.create({
      group_id: id,
      user_id: req.user.id,
      role: "member",
    });

    // Update group member count
    await ChatGroup.increment("member_count", { where: { id } });

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`group_${id}`).emit("userJoined", {
      userId: req.user.id,
      userName: req.user.full_name,
      groupId: id,
    });

    logger.info(`User ${req.user.id} joined group ${id}`);

    res.json(createResponse("success", "Successfully joined group"));
  }),

  // Leave group
  leaveGroup: catchAsync(async (req, res) => {
    const { id } = req.params;

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Check if user is creator
    if (group.creator_id === req.user.id) {
      throw new AppError(
        "Creator cannot leave the group. Transfer ownership or delete the group instead.",
        400
      );
    }

    const membership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
      },
    });

    if (!membership) {
      throw new AppError("You are not a member of this group", 400);
    }

    await membership.destroy();

    // Update group member count
    await ChatGroup.decrement("member_count", { where: { id } });

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`group_${id}`).emit("userLeft", {
      userId: req.user.id,
      userName: req.user.full_name,
      groupId: id,
    });

    logger.info(`User ${req.user.id} left group ${id}`);

    res.json(createResponse("success", "Successfully left group"));
  }),

  // Get group members
  getGroupMembers: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    const { count, rows: members } = await ChatGroupMember.findAndCountAll({
      where: { group_id: id },
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "university", "profile_picture"],
        },
      ],
      order: [
        ["role", "ASC"],
        ["joined_at", "ASC"],
      ],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Group members retrieved successfully",
        members,
        meta
      )
    );
  }),

  // Promote to admin
  promoteToAdmin: catchAsync(async (req, res) => {
    const { id, userId } = req.params;

    // Check if current user is admin
    const currentUserMembership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
        role: "admin",
      },
    });

    if (!currentUserMembership) {
      throw new AppError("You must be an admin to promote members", 403);
    }

    const targetMembership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: userId,
      },
    });

    if (!targetMembership) {
      throw new AppError("User is not a member of this group", 400);
    }

    if (targetMembership.role === "admin") {
      throw new AppError("User is already an admin", 400);
    }

    await targetMembership.update({ role: "admin" });

    logger.info(
      `User ${userId} promoted to admin in group ${id} by user ${req.user.id}`
    );

    res.json(createResponse("success", "User promoted to admin successfully"));
  }),

  // Demote from admin
  demoteFromAdmin: catchAsync(async (req, res) => {
    const { id, userId } = req.params;

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Only creator can demote admins
    if (group.creator_id !== req.user.id) {
      throw new AppError("Only the creator can demote admins", 403);
    }

    // Creator cannot demote themselves
    if (userId === req.user.id.toString()) {
      throw new AppError("Creator cannot demote themselves", 400);
    }

    const targetMembership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: userId,
      },
    });

    if (!targetMembership) {
      throw new AppError("User is not a member of this group", 400);
    }

    if (targetMembership.role !== "admin") {
      throw new AppError("User is not an admin", 400);
    }

    await targetMembership.update({ role: "member" });

    logger.info(
      `User ${userId} demoted from admin in group ${id} by user ${req.user.id}`
    );

    res.json(createResponse("success", "User demoted from admin successfully"));
  }),

  // Remove member
  removeMember: catchAsync(async (req, res) => {
    const { id, userId } = req.params;

    const group = await ChatGroup.findByPk(id);

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // Check if current user is admin
    const currentUserMembership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
        role: "admin",
      },
    });

    if (!currentUserMembership) {
      throw new AppError("You must be an admin to remove members", 403);
    }

    // Cannot remove creator
    if (group.creator_id === parseInt(userId)) {
      throw new AppError("Cannot remove the group creator", 400);
    }

    const targetMembership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: userId,
      },
    });

    if (!targetMembership) {
      throw new AppError("User is not a member of this group", 400);
    }

    await targetMembership.destroy();

    // Update group member count
    await ChatGroup.decrement("member_count", { where: { id } });

    logger.info(
      `User ${userId} removed from group ${id} by user ${req.user.id}`
    );

    res.json(createResponse("success", "Member removed successfully"));
  }),

  // Get group messages
  getGroupMessages: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    // Check if user is a member
    const membership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
      },
    });

    if (!membership) {
      throw new AppError("You must be a member to view group messages", 403);
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { group_id: id },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "full_name", "profile_picture"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Messages retrieved successfully",
        messages.reverse(), // Reverse to show oldest first
        meta
      )
    );
  }),

  // Send message
  sendMessage: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { content, message_type = "text" } = req.body;

    // Check if user is a member
    const membership = await ChatGroupMember.findOne({
      where: {
        group_id: id,
        user_id: req.user.id,
      },
    });

    if (!membership) {
      throw new AppError("You must be a member to send messages", 403);
    }

    const message = await Message.create({
      group_id: id,
      sender_id: req.user.id,
      content,
      message_type,
    });

    // Award coins for sending message
    const coinAmount = calculateCoins("message_send");
    await CoinsTransaction.create({
      user_id: req.user.id,
      amount: coinAmount,
      transaction_type: "message_send",
      description: `Sent message in group`,
      reference_id: message.id,
    });

    // Update user's coin balance
    await User.increment("coins_balance", {
      by: coinAmount,
      where: { id: req.user.id },
    });

    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "full_name", "profile_picture"],
        },
      ],
    });

    // Emit socket event for real-time message
    const io = req.app.get("io");
    io.to(`group_${id}`).emit("newMessage", messageWithSender);

    logger.info(`Message sent in group ${id} by user ${req.user.id}`);

    res
      .status(201)
      .json(
        createResponse(
          "success",
          "Message sent successfully",
          messageWithSender
        )
      );
  }),

  // Update message
  updateMessage: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findByPk(id);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Check if user is the sender
    if (message.sender_id !== req.user.id) {
      throw new AppError("You can only update your own messages", 403);
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.created_at < fifteenMinutesAgo) {
      throw new AppError("Cannot update messages older than 15 minutes", 400);
    }

    await message.update({ content, is_edited: true });

    const updatedMessage = await Message.findByPk(id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "full_name", "profile_picture"],
        },
      ],
    });

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`group_${message.group_id}`).emit("messageUpdated", updatedMessage);

    logger.info(`Message ${id} updated by user ${req.user.id}`);

    res.json(
      createResponse("success", "Message updated successfully", updatedMessage)
    );
  }),

  // Delete message
  deleteMessage: catchAsync(async (req, res) => {
    const { id } = req.params;

    const message = await Message.findByPk(id);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Check if user is the sender or group admin
    const isOwner = message.sender_id === req.user.id;
    const isAdmin = await ChatGroupMember.findOne({
      where: {
        group_id: message.group_id,
        user_id: req.user.id,
        role: "admin",
      },
    });

    if (!isOwner && !isAdmin) {
      throw new AppError(
        "You can only delete your own messages or you must be an admin",
        403
      );
    }

    await message.destroy();

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`group_${message.group_id}`).emit("messageDeleted", {
      messageId: id,
    });

    logger.info(`Message ${id} deleted by user ${req.user.id}`);

    res.json(createResponse("success", "Message deleted successfully"));
  }),

  // Get conversations (for direct messages)
  getConversations: catchAsync(async (req, res) => {
    // This would require a separate implementation for direct messages
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Conversations retrieved successfully", [])
    );
  }),

  // Get conversation with specific user
  getConversationWithUser: catchAsync(async (req, res) => {
    // This would require a separate implementation for direct messages
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Conversation retrieved successfully", [])
    );
  }),

  // Send direct message
  sendDirectMessage: catchAsync(async (req, res) => {
    // This would require a separate implementation for direct messages
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Direct message sent successfully"));
  }),
};

module.exports = chatController;
