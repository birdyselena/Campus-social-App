/**
 * 数据验证和清理工具
 * 确保存储数据的完整性和一致性
 */

import {
  getStorageData,
  setStorageData,
  STORAGE_KEYS,
} from "../services/localStorage";

/**
 * 验证并清理讨论数据
 */
export const validateAndCleanDiscussions = async () => {
  try {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);

    const cleanedDiscussions = discussions.map((discussion) => ({
      ...discussion,
      // 确保必要字段存在
      author_name:
        discussion.author_name || discussion.user_name || "Unknown User",
      title: discussion.title || "Untitled Discussion",
      content: discussion.content || "",
      type: discussion.type || "general",
      likes: discussion.likes || 0,
      liked_by: discussion.liked_by || [],
      replies: (discussion.replies || []).map((reply) => ({
        ...reply,
        author_name: reply.author_name || reply.user_name || "Unknown User",
        content: reply.content || "",
        created_at: reply.created_at || new Date().toISOString(),
      })),
      created_at: discussion.created_at || new Date().toISOString(),
    }));

    await setStorageData(STORAGE_KEYS.DISCUSSIONS, cleanedDiscussions);
    console.log("Discussions data cleaned successfully");
    return cleanedDiscussions;
  } catch (error) {
    console.error("Error cleaning discussions:", error);
    return [];
  }
};

/**
 * 验证并清理聊天消息数据
 */
export const validateAndCleanMessages = async () => {
  try {
    const messages = await getStorageData(STORAGE_KEYS.MESSAGES);

    const cleanedMessages = messages.map((message) => ({
      ...message,
      // 确保必要字段存在
      sender_name: message.sender_name || message.user_name || "Unknown User",
      content: message.content || "",
      created_at: message.created_at || new Date().toISOString(),
    }));

    await setStorageData(STORAGE_KEYS.MESSAGES, cleanedMessages);
    console.log("Messages data cleaned successfully");
    return cleanedMessages;
  } catch (error) {
    console.error("Error cleaning messages:", error);
    return [];
  }
};

/**
 * 验证并清理用户数据
 */
export const validateAndCleanUsers = async () => {
  try {
    const users = await getStorageData(STORAGE_KEYS.USERS);

    const cleanedUsers = users.map((user) => ({
      ...user,
      // 确保必要字段存在
      full_name: user.full_name || user.name || "Unknown User",
      name: user.name || user.full_name || "Unknown User",
      email: user.email || "",
      coins_balance:
        typeof user.coins_balance === "number"
          ? user.coins_balance
          : user.coins || 0,
      coins:
        typeof user.coins === "number" ? user.coins : user.coins_balance || 0,
      created_at: user.created_at || new Date().toISOString(),
    }));

    await setStorageData(STORAGE_KEYS.USERS, cleanedUsers);
    console.log("Users data cleaned successfully");
    return cleanedUsers;
  } catch (error) {
    console.error("Error cleaning users:", error);
    return [];
  }
};

/**
 * 验证并清理所有数据
 */
export const validateAndCleanAllData = async () => {
  console.log("Starting data validation and cleaning...");

  try {
    await Promise.all([
      validateAndCleanDiscussions(),
      validateAndCleanMessages(),
      validateAndCleanUsers(),
    ]);

    console.log("All data validation and cleaning completed");
    return true;
  } catch (error) {
    console.error("Error during data validation:", error);
    return false;
  }
};

/**
 * 检查数据完整性
 */
export const checkDataIntegrity = async () => {
  try {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const messages = await getStorageData(STORAGE_KEYS.MESSAGES);
    const users = await getStorageData(STORAGE_KEYS.USERS);

    console.log("Data Integrity Check:");
    console.log("- Discussions:", discussions.length);
    console.log("- Messages:", messages.length);
    console.log("- Users:", users.length);

    // 检查讨论中是否有缺失的author_name
    const discussionsWithoutAuthor = discussions.filter(
      (d) => !d.author_name && !d.user_name
    );
    if (discussionsWithoutAuthor.length > 0) {
      console.warn(
        "Found discussions without author_name:",
        discussionsWithoutAuthor.length
      );
    }

    // 检查消息中是否有缺失的sender_name
    const messagesWithoutSender = messages.filter(
      (m) => !m.sender_name && !m.user_name
    );
    if (messagesWithoutSender.length > 0) {
      console.warn(
        "Found messages without sender_name:",
        messagesWithoutSender.length
      );
    }

    return {
      discussions: discussions.length,
      messages: messages.length,
      users: users.length,
      issues: {
        discussionsWithoutAuthor: discussionsWithoutAuthor.length,
        messagesWithoutSender: messagesWithoutSender.length,
      },
    };
  } catch (error) {
    console.error("Error checking data integrity:", error);
    return null;
  }
};
