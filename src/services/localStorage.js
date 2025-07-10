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
    try {
      const users = await getStorageData(STORAGE_KEYS.USERS);
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        console.error("User not found:", userId);
        throw new Error("User not found");
      }

      // 确保 coins_balance 字段存在，如果不存在则初始化为100
      if (typeof users[userIndex].coins_balance !== "number") {
        users[userIndex].coins_balance = 100; // 默认初始积分
        console.log(`初始化用户 ${userId} 的积分: 100`);
      }

      users[userIndex].coins_balance += amount;

      // 防止积分变为负数
      if (users[userIndex].coins_balance < 0) {
        users[userIndex].coins_balance = 0;
      }

      // 同时更新旧的 coins 字段以保持兼容性
      users[userIndex].coins = users[userIndex].coins_balance;

      const success = await setStorageData(STORAGE_KEYS.USERS, users);
      if (!success) {
        throw new Error("Failed to save user data");
      }

      console.log(
        `用户 ${userId} 积分更新: ${amount > 0 ? "+" : ""}${amount}, 新余额: ${
          users[userIndex].coins_balance
        }`
      );
      return users[userIndex];
    } catch (error) {
      console.error("Error updating user coins:", error);
      throw new Error("Failed to update user coins");
    }
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

  // 初始化用户积分（如果用户没有积分记录）
  initializeUserCoins: async (userId) => {
    try {
      const users = await getStorageData(STORAGE_KEYS.USERS);
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex !== -1) {
        // 确保用户有积分字段
        if (typeof users[userIndex].coins_balance !== "number") {
          users[userIndex].coins_balance = 100; // 默认初始积分
          users[userIndex].coins = 100; // 兼容性
          await setStorageData(STORAGE_KEYS.USERS, users);
          console.log(`初始化用户 ${userId} 的积分: 100`);
        }
        return users[userIndex];
      }
      return null;
    } catch (error) {
      console.error("Error initializing user coins:", error);
      return null;
    }
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
    console.log("All discussions:", allDiscussions);
    console.log("Looking for groupId:", groupId, "type:", typeof groupId);

    // 简化的匹配 - 如果没有找到精确匹配，返回所有讨论用于测试
    let filtered = allDiscussions.filter(
      (discussion) =>
        discussion.group_id === groupId ||
        discussion.group_id === groupId.toString()
    );

    // 如果没有找到匹配的，返回前几个讨论作为示例
    if (filtered.length === 0 && allDiscussions.length > 0) {
      console.log("No exact matches found, returning sample discussions");
      filtered = allDiscussions.slice(0, 3);
    }

    console.log("Filtered discussions:", filtered);
    return filtered;
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

// 积分系统
export const coinsService = {
  // 获取用户积分余额
  getUserCoinsBalance: async (userId) => {
    try {
      const users = await getStorageData(STORAGE_KEYS.USERS);
      const user = users.find((u) => u.id === userId);

      if (!user) {
        console.warn(`用户 ${userId} 不存在`);
        return 0;
      }

      // 如果用户没有积分记录，初始化为100积分
      if (typeof user.coins_balance !== "number") {
        console.log(`初始化用户 ${userId} 的积分显示`);
        return 100; // 默认积分
      }

      return user.coins_balance || 0;
    } catch (error) {
      console.error("Error getting user coins balance:", error);
      return 0;
    }
  },

  // 添加积分交易记录
  addCoinsTransaction: async (
    userId,
    amount,
    type,
    description,
    referenceId = null
  ) => {
    try {
      const transactions = await getStorageData(
        STORAGE_KEYS.COINS_TRANSACTIONS
      );
      const transaction = {
        id: generateId(),
        user_id: userId,
        amount: amount,
        type: type, // 'earn' or 'redeem'
        transaction_type: type === "earn" ? "activity_reward" : "redemption",
        description: description,
        reference_id: referenceId,
        created_at: new Date().toISOString(),
      };

      transactions.push(transaction);
      await setStorageData(STORAGE_KEYS.COINS_TRANSACTIONS, transactions);

      // 更新用户积分余额
      const updatedUser = await userStorage.updateUserCoins(userId, amount);
      if (!updatedUser) {
        throw new Error("Failed to update user coins balance");
      }

      return transaction;
    } catch (error) {
      console.error("Error adding coins transaction:", error);
      throw error;
    }
  },

  // 获取用户交易记录
  getUserTransactions: async (userId) => {
    const transactions = await getStorageData(STORAGE_KEYS.COINS_TRANSACTIONS);
    return transactions
      .filter((t) => t.user_id === userId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  // 活动积分奖励
  rewardEventParticipation: async (userId, eventId, eventTitle) => {
    return await coinsService.addCoinsTransaction(
      userId,
      20, // 参加活动奖励20积分
      "earn",
      `参加活动: ${eventTitle}`,
      eventId
    );
  },

  // 创建活动积分奖励
  rewardEventCreation: async (userId, eventId, eventTitle) => {
    return await coinsService.addCoinsTransaction(
      userId,
      50, // 创建活动奖励50积分
      "earn",
      `创建活动: ${eventTitle}`,
      eventId
    );
  },

  // 每日登录奖励
  rewardDailyLogin: async (userId) => {
    const today = new Date().toDateString();
    const transactions = await getStorageData(STORAGE_KEYS.COINS_TRANSACTIONS);

    // 检查今天是否已经获得每日奖励
    const todayReward = transactions.find(
      (t) =>
        t.user_id === userId &&
        (t.transaction_type === "daily_login" ||
          t.description === "每日登录奖励") &&
        new Date(t.created_at).toDateString() === today
    );

    if (todayReward) {
      throw new Error("今天已经获得过每日登录奖励了");
    }

    // 创建特殊的每日登录交易记录
    const transactions_list = await getStorageData(
      STORAGE_KEYS.COINS_TRANSACTIONS
    );
    const transaction = {
      id: generateId(),
      user_id: userId,
      amount: 10,
      type: "earn",
      transaction_type: "daily_login",
      description: "每日登录奖励",
      reference_id: null,
      created_at: new Date().toISOString(),
    };

    transactions_list.push(transaction);
    await setStorageData(STORAGE_KEYS.COINS_TRANSACTIONS, transactions_list);

    // 更新用户积分余额
    const updatedUser = await userStorage.updateUserCoins(userId, 10);
    if (!updatedUser) {
      throw new Error("Failed to update user coins balance");
    }

    return transaction;
  },

  // 群聊创建奖励
  rewardGroupCreation: async (userId, groupId, groupName) => {
    return await coinsService.addCoinsTransaction(
      userId,
      30, // 创建群聊奖励30积分
      "earn",
      `创建群聊: ${groupName}`,
      groupId
    );
  },

  // 兑换合作伙伴优惠
  redeemPartnerOffer: async (userId, brandId, brandName, coinsRequired) => {
    const userBalance = await coinsService.getUserCoinsBalance(userId);

    if (userBalance < coinsRequired) {
      throw new Error("积分不足");
    }

    return await coinsService.addCoinsTransaction(
      userId,
      -coinsRequired, // 负数表示扣除积分
      "redeem",
      `兑换: ${brandName}`,
      brandId
    );
  },

  // 获取合作伙伴品牌
  getPartnerBrands: async () => {
    let brands = await getStorageData(STORAGE_KEYS.PARTNER_BRANDS);

    if (brands.length === 0) {
      // 初始化默认品牌数据
      brands = [
        {
          id: "1",
          name: "KFC",
          description: "肯德基全鸡家桶优惠券",
          logo: "🍗",
          coins_required: 100,
          discount_percentage: 20,
          category: "Food & Beverage",
          website_url: "https://www.kfc.com.au",
          redemption_code: "KFC20OFF",
          is_active: true,
        },
        {
          id: "2",
          name: "UNSW Bookshop",
          description: "UNSW书店教材折扣",
          logo: "📚",
          coins_required: 150,
          discount_percentage: 15,
          category: "Education",
          website_url: "https://www.bookshop.unsw.edu.au",
          redemption_code: "UNSW15OFF",
          is_active: true,
        },
        {
          id: "3",
          name: "McDonald's",
          description: "麦当劳超值套餐券",
          logo: "🍟",
          coins_required: 80,
          discount_percentage: 25,
          category: "Food & Beverage",
          website_url: "https://www.mcdonalds.com.au",
          redemption_code: "MCD25OFF",
          is_active: true,
        },
        {
          id: "4",
          name: "JB Hi-Fi",
          description: "JB Hi-Fi电子产品优惠",
          logo: "🎧",
          coins_required: 200,
          discount_percentage: 10,
          category: "Electronics",
          website_url: "https://www.jbhifi.com.au",
          redemption_code: "JBHIFI10",
          is_active: true,
        },
        {
          id: "5",
          name: "Boost Juice",
          description: "Boost果汁店饮品券",
          logo: "🥤",
          coins_required: 60,
          discount_percentage: 30,
          category: "Food & Beverage",
          website_url: "https://www.boostjuice.com.au",
          redemption_code: "BOOST30",
          is_active: true,
        },
      ];

      await setStorageData(STORAGE_KEYS.PARTNER_BRANDS, brands);
    }

    return brands.filter((brand) => brand.is_active);
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
        group_id: "1",
        title: "Welcome to Computer Science Study Group",
        content:
          "Let's introduce ourselves and share our study goals for this semester!",
        type: "announcement",
        author_name: "Test User",
        author_id: "test-user-1",
        likes: 5,
        liked_by: [],
        replies: [],
        created_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        group_id: "1",
        title: "Data Structures Assignment Help",
        content:
          "Anyone struggling with the binary tree assignment? Let's discuss approaches and solutions.",
        type: "question",
        author_name: "Test User",
        author_id: "test-user-1",
        likes: 3,
        liked_by: [],
        replies: [],
        created_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        group_id: "2",
        title: "Study Session This Weekend",
        content:
          "Planning a study session for the upcoming midterm. Who's interested?",
        type: "general",
        author_name: "Test User",
        author_id: "test-user-1",
        likes: 8,
        liked_by: [],
        replies: [],
        created_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        group_id: "3",
        title: "UNSW Library Study Spots",
        content:
          "Best quiet study spots in the library? Share your recommendations!",
        type: "question",
        author_name: "Test User",
        author_id: "test-user-1",
        likes: 2,
        liked_by: [],
        replies: [],
        created_at: new Date().toISOString(),
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
    return true;
  } catch (error) {
    console.error("Error clearing storage data:", error);
    return false;
  }
};

// 重新初始化讨论数据
export const reinitializeDiscussions = async () => {
  // 清除现有讨论数据
  await setStorageData(STORAGE_KEYS.DISCUSSIONS, []);

  // 获取现有的events和chat groups来创建对应的discussions
  const events = await getStorageData(STORAGE_KEYS.EVENTS);
  const chatGroups = await getStorageData(STORAGE_KEYS.CHAT_GROUPS);

  const sampleDiscussions = [
    // 常规聊天组讨论
    {
      id: generateId(),
      group_id: "1",
      title: "Welcome to Computer Science Study Group",
      content:
        "Let's introduce ourselves and share our study goals for this semester!",
      type: "announcement",
      author_name: "Test User",
      author_id: "test-user-1",
      likes: 5,
      liked_by: [],
      replies: [],
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      group_id: "1",
      title: "Data Structures Assignment Help",
      content:
        "Anyone struggling with the binary tree assignment? Let's discuss approaches and solutions.",
      type: "question",
      author_name: "Test User",
      author_id: "test-user-1",
      likes: 3,
      liked_by: [],
      replies: [],
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      group_id: "2",
      title: "Study Session This Weekend",
      content:
        "Planning a study session for the upcoming midterm. Who's interested?",
      type: "general",
      author_name: "Test User",
      author_id: "test-user-1",
      likes: 8,
      liked_by: [],
      replies: [],
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      group_id: "3",
      title: "UNSW Library Study Spots",
      content:
        "Best quiet study spots in the library? Share your recommendations!",
      type: "question",
      author_name: "Test User",
      author_id: "test-user-1",
      likes: 2,
      liked_by: [],
      replies: [],
      created_at: new Date().toISOString(),
    },
  ];

  // 为每个event创建对应的讨论
  events.forEach((event) => {
    const eventGroupId = `event_${event.id}`;
    sampleDiscussions.push({
      id: generateId(),
      group_id: eventGroupId,
      title: `Welcome to ${event.title} Discussion`,
      content: `Let's discuss everything about ${event.title}! Share your thoughts, ask questions, and connect with other attendees.`,
      type: "announcement",
      author_name: "Event Organizer",
      author_id: "event-organizer",
      likes: 0,
      liked_by: [],
      replies: [],
      created_at: new Date().toISOString(),
    });
  });

  await setStorageData(STORAGE_KEYS.DISCUSSIONS, sampleDiscussions);
  console.log("Discussions data reinitialized:", sampleDiscussions);
  return sampleDiscussions;
};

export { STORAGE_KEYS, generateId };
