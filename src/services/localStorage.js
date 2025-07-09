import AsyncStorage from "@react-native-async-storage/async-storage";

// 存储键
const STORAGE_KEYS = {
  USERS: "users",
  EVENTS: "events",
  CHAT_GROUPS: "chat_groups",
  MESSAGES: "messages",
  DISCUSSIONS: "discussions", // 新增讨论存储键
  COINS_TRANSACTIONS: "coins_transactions",
  PARTNER_BRANDS: "partner_brands",
  CURRENT_USER: "current_user",
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 获取数据
export const getStorageData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting storage data:", error);
    return [];
  }
};

// 保存数据
export const setStorageData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving storage data:", error);
    return false;
  }
};

// 用户相关操作
export const userStorage = {
  // 保存当前用户
  saveCurrentUser: async (user) => {
    return await setStorageData(STORAGE_KEYS.CURRENT_USER, user);
  },

  // 获取当前用户
  getCurrentUser: async () => {
    const data = await getStorageData(STORAGE_KEYS.CURRENT_USER);
    return data;
  },

  // 清除当前用户
  clearCurrentUser: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // 注册用户
  registerUser: async (userData) => {
    const users = await getStorageData(STORAGE_KEYS.USERS);
    const newUser = {
      id: generateId(),
      ...userData,
      coins_balance: 100, // 初始金币
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    await setStorageData(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // 用户登录验证
  loginUser: async (email, password) => {
    const users = await getStorageData(STORAGE_KEYS.USERS);
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    return user;
  },

  // 更新用户金币
  updateUserCoins: async (userId, amount) => {
    const users = await getStorageData(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].coins_balance += amount;
      await setStorageData(STORAGE_KEYS.USERS, users);
      return users[userIndex];
    }
    return null;
  },

  // 获取所有用户
  getAllUsers: async () => {
    return await getStorageData(STORAGE_KEYS.USERS);
  },

  // 更新用户信息
  updateUser: async (userId, userData) => {
    const users = await getStorageData(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData };
      await setStorageData(STORAGE_KEYS.USERS, users);
      return users[userIndex];
    }
    return null;
  },

  // 获取用户资料
  fetchUserProfile: async (userId) => {
    const users = await getStorageData(STORAGE_KEYS.USERS);
    return users.find((u) => u.id === userId);
  },

  // 创建用户（用于注册）
  createUser: async (userData) => {
    const users = await getStorageData(STORAGE_KEYS.USERS);
    const newUser = {
      id: generateId(),
      ...userData,
      coins_balance: 100, // 初始金币
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    await setStorageData(STORAGE_KEYS.USERS, users);
    return newUser;
  },
};

// 活动相关操作
export const eventStorage = {
  // 获取所有活动
  getAllEvents: async () => {
    return await getStorageData(STORAGE_KEYS.EVENTS);
  },

  // 创建活动
  createEvent: async (eventData) => {
    const events = await getStorageData(STORAGE_KEYS.EVENTS);
    const newEvent = {
      id: generateId(),
      ...eventData,
      attendeeCount: 0,
      attendees: [],
      created_at: new Date().toISOString(),
    };
    events.push(newEvent);
    await setStorageData(STORAGE_KEYS.EVENTS, events);
    return newEvent;
  },

  // 参加活动
  attendEvent: async (eventId, userId) => {
    const events = await getStorageData(STORAGE_KEYS.EVENTS);
    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      if (!events[eventIndex].attendees) {
        events[eventIndex].attendees = [];
      }
      if (!events[eventIndex].attendees.includes(userId)) {
        events[eventIndex].attendees.push(userId);
        events[eventIndex].attendeeCount = events[eventIndex].attendees.length;
        await setStorageData(STORAGE_KEYS.EVENTS, events);
      }
    }
    return events[eventIndex];
  },

  // 取消参加活动
  cancelAttendEvent: async (eventId, userId) => {
    const events = await getStorageData(STORAGE_KEYS.EVENTS);
    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex].attendees = events[eventIndex].attendees.filter(
        (id) => id !== userId
      );
      events[eventIndex].attendeeCount = events[eventIndex].attendees.length;
      await setStorageData(STORAGE_KEYS.EVENTS, events);
    }
    return events[eventIndex];
  },
};

// 聊天相关操作
export const chatStorage = {
  // 获取所有聊天组
  getAllChatGroups: async () => {
    return await getStorageData(STORAGE_KEYS.CHAT_GROUPS);
  },

  // 创建聊天组
  createChatGroup: async (groupData) => {
    const groups = await getStorageData(STORAGE_KEYS.CHAT_GROUPS);
    const newGroup = {
      id: generateId(),
      ...groupData,
      members: [groupData.created_by],
      member_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    groups.push(newGroup);
    await setStorageData(STORAGE_KEYS.CHAT_GROUPS, groups);
    return newGroup;
  },

  // 获取聊天组消息
  getGroupMessages: async (groupId) => {
    const allMessages = await getStorageData(STORAGE_KEYS.MESSAGES);
    return allMessages.filter((msg) => msg.group_id === groupId);
  },

  // 发送消息
  sendMessage: async (messageData) => {
    const messages = await getStorageData(STORAGE_KEYS.MESSAGES);
    const newMessage = {
      id: generateId(),
      ...messageData,
      created_at: new Date().toISOString(),
    };
    messages.push(newMessage);
    await setStorageData(STORAGE_KEYS.MESSAGES, messages);
    return newMessage;
  },

  // 加入聊天组
  joinChatGroup: async (groupId, userId) => {
    const groups = await getStorageData(STORAGE_KEYS.CHAT_GROUPS);
    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex !== -1) {
      if (!groups[groupIndex].members.includes(userId)) {
        groups[groupIndex].members.push(userId);
        groups[groupIndex].member_count = groups[groupIndex].members.length;
        await setStorageData(STORAGE_KEYS.CHAT_GROUPS, groups);
      }
    }
    return groups[groupIndex];
  },

  // 离开聊天组
  leaveChatGroup: async (groupId, userId) => {
    const groups = await getStorageData(STORAGE_KEYS.CHAT_GROUPS);
    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex !== -1) {
      groups[groupIndex].members = groups[groupIndex].members.filter(
        (id) => id !== userId
      );
      groups[groupIndex].member_count = groups[groupIndex].members.length;
      await setStorageData(STORAGE_KEYS.CHAT_GROUPS, groups);
    }
    return groups[groupIndex];
  },

  // 获取群组讨论
  getGroupDiscussions: async (groupId) => {
    const allDiscussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    return allDiscussions.filter(
      (discussion) => discussion.group_id === groupId
    );
  },

  // 创建讨论
  createDiscussion: async (discussionData) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const newDiscussion = {
      id: generateId(),
      ...discussionData,
      replies: [],
      likes: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
    };
    discussions.push(newDiscussion);
    await setStorageData(STORAGE_KEYS.DISCUSSIONS, discussions);
    return newDiscussion;
  },

  // 获取讨论详情
  getDiscussionById: async (discussionId) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    return discussions.find((d) => d.id === discussionId);
  },

  // 点赞讨论
  likeDiscussion: async (discussionId, userId) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const discussionIndex = discussions.findIndex((d) => d.id === discussionId);

    if (discussionIndex !== -1) {
      const discussion = discussions[discussionIndex];
      if (!discussion.liked_by) {
        discussion.liked_by = [];
      }

      if (discussion.liked_by.includes(userId)) {
        // 取消点赞
        discussion.liked_by = discussion.liked_by.filter((id) => id !== userId);
        discussion.likes = Math.max(0, discussion.likes - 1);
      } else {
        // 点赞
        discussion.liked_by.push(userId);
        discussion.likes = (discussion.likes || 0) + 1;
      }

      await setStorageData(STORAGE_KEYS.DISCUSSIONS, discussions);
    }
    return discussions[discussionIndex];
  },

  // 添加回复
  addDiscussionReply: async (discussionId, replyData) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const discussionIndex = discussions.findIndex((d) => d.id === discussionId);

    if (discussionIndex !== -1) {
      const reply = {
        id: generateId(),
        ...replyData,
        created_at: new Date().toISOString(),
      };

      if (!discussions[discussionIndex].replies) {
        discussions[discussionIndex].replies = [];
      }

      discussions[discussionIndex].replies.push(reply);
      await setStorageData(STORAGE_KEYS.DISCUSSIONS, discussions);
      return reply;
    }
    return null;
  },
};

// 金币交易相关操作
export const coinsStorage = {
  // 获取用户交易记录
  getUserTransactions: async (userId) => {
    const transactions = await getStorageData(STORAGE_KEYS.COINS_TRANSACTIONS);
    return transactions.filter((t) => t.user_id === userId);
  },

  // 添加交易记录
  addTransaction: async (transactionData) => {
    const transactions = await getStorageData(STORAGE_KEYS.COINS_TRANSACTIONS);
    const newTransaction = {
      id: generateId(),
      ...transactionData,
      created_at: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    await setStorageData(STORAGE_KEYS.COINS_TRANSACTIONS, transactions);
    return newTransaction;
  },
};

// 讨论相关操作
export const discussionStorage = {
  // 获取所有讨论
  getAllDiscussions: async () => {
    return await getStorageData(STORAGE_KEYS.DISCUSSIONS);
  },

  // 创建讨论
  createDiscussion: async (discussionData) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const newDiscussion = {
      id: generateId(),
      ...discussionData,
      messages: [],
      created_at: new Date().toISOString(),
    };
    discussions.push(newDiscussion);
    await setStorageData(STORAGE_KEYS.DISCUSSIONS, discussions);
    return newDiscussion;
  },

  // 获取讨论消息
  getDiscussionMessages: async (discussionId) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const discussion = discussions.find((d) => d.id === discussionId);
    return discussion ? discussion.messages : [];
  },

  // 发送讨论消息
  sendDiscussionMessage: async (discussionId, messageData) => {
    const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
    const discussionIndex = discussions.findIndex((d) => d.id === discussionId);
    if (discussionIndex !== -1) {
      const newMessage = {
        id: generateId(),
        ...messageData,
        created_at: new Date().toISOString(),
      };
      discussions[discussionIndex].messages.push(newMessage);
      await setStorageData(STORAGE_KEYS.DISCUSSIONS, discussions);
      return newMessage;
    }
    return null;
  },
};

// 初始化示例数据
export const initializeData = async () => {
  // 检查是否已经初始化用户
  const users = await getStorageData(STORAGE_KEYS.USERS);
  if (users.length === 0) {
    // 初始化示例用户
    const sampleUsers = [
      {
        id: generateId(),
        email: "student@university.edu",
        password: "password123",
        full_name: "Test Student",
        name: "Test Student",
        student_id: "12345678",
        university: "Beijing University",
        major: "Computer Science",
        year: 2024,
        coins_balance: 100,
        created_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        email: "alice@university.edu",
        password: "password123",
        full_name: "Alice Johnson",
        name: "Alice Johnson",
        student_id: "87654321",
        university: "Beijing University",
        major: "Engineering",
        year: 2023,
        coins_balance: 150,
        created_at: new Date().toISOString(),
      },
    ];
    await setStorageData(STORAGE_KEYS.USERS, sampleUsers);
  }

  // 检查是否已经初始化
  const events = await getStorageData(STORAGE_KEYS.EVENTS);
  if (events.length === 0) {
    // 初始化示例活动
    const sampleEvents = [
      {
        id: generateId(),
        title: "校园编程比赛",
        description: "展示你的编程技能，与同学们一起竞技！",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: "计算机科学大楼",
        university: "北京大学",
        coins_reward: 50,
        attendees: [],
        attendeeCount: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: "社团文化节",
        description: "各个社团展示活动，欢迎大家参加！",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: "学生活动中心",
        university: "北京大学",
        coins_reward: 30,
        attendees: [],
        attendeeCount: 0,
        created_at: new Date().toISOString(),
      },
    ];
    await setStorageData(STORAGE_KEYS.EVENTS, sampleEvents);
  }

  // 初始化聊天组
  const groups = await getStorageData(STORAGE_KEYS.CHAT_GROUPS);
  if (groups.length === 0) {
    const sampleGroups = [
      {
        id: generateId(),
        name: "Computer Science Discussion",
        description: "Discuss programming, algorithms and tech topics",
        is_public: true,
        university: "Beijing University",
        members: [],
        member_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: "Campus Life Sharing",
        description: "Share campus life experiences",
        is_public: true,
        university: "Beijing University",
        members: [],
        member_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: "Study Group",
        description: "Study together and help each other",
        is_public: true,
        university: "Beijing University",
        members: [],
        member_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: "Sports & Activities",
        description: "Organize sports activities and events",
        is_public: true,
        university: "Beijing University",
        members: [],
        member_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    await setStorageData(STORAGE_KEYS.CHAT_GROUPS, sampleGroups);
  }

  // 初始化讨论
  const discussions = await getStorageData(STORAGE_KEYS.DISCUSSIONS);
  if (discussions.length === 0) {
    const sampleDiscussions = [
      {
        id: generateId(),
        title: "关于校园活动的讨论",
        description: "讨论即将举行的校园活动",
        created_at: new Date().toISOString(),
        messages: [],
      },
      {
        id: generateId(),
        title: "学习资料分享",
        description: "分享各类学习资料和资源",
        created_at: new Date().toISOString(),
        messages: [],
      },
    ];
    await setStorageData(STORAGE_KEYS.DISCUSSIONS, sampleDiscussions);
  }
};

// 清除所有存储数据（用于开发测试）
export const clearAllStorageData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USERS,
      STORAGE_KEYS.EVENTS,
      STORAGE_KEYS.CHAT_GROUPS,
      STORAGE_KEYS.MESSAGES,
      STORAGE_KEYS.DISCUSSIONS,
      STORAGE_KEYS.COINS_TRANSACTIONS,
      STORAGE_KEYS.PARTNER_BRANDS,
      STORAGE_KEYS.CURRENT_USER,
    ]);
    console.log("All storage data cleared");
  } catch (error) {
    console.error("Error clearing storage data:", error);
  }
};

export { STORAGE_KEYS, generateId };
