import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userStorage } from "../services/localStorage";

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from storage on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const savedUser = await userStorage.getCurrentUser();
      if (savedUser && savedUser.id) {
        setUser(savedUser);
        setIsAuthenticated(true);
      } else {
        // 如果没有用户数据，自动登录测试用户
        const testUser = {
          id: "test-user-1",
          email: "test@example.com",
          full_name: "Test User",
          name: "Test User",
          university: "Test University",
          coins_balance: 100,
          coins: 100,
        };
        setUser(testUser);
        setIsAuthenticated(true);
        await userStorage.saveCurrentUser(testUser);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // For now, we'll use local storage authentication
      // In a real app, this would make an API call to your backend
      const users = await userStorage.getAllUsers();
      const foundUser = users.find(
        (u) => u.email === email && u.password === password
      );

      if (foundUser) {
        setUser(foundUser);
        setIsAuthenticated(true);
        await userStorage.saveCurrentUser(foundUser);
        return { success: true, user: foundUser };
      } else {
        return { success: false, error: "Invalid email or password" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // Create new user with local storage
      const newUser = await userStorage.createUser(userData);
      setUser(newUser);
      setIsAuthenticated(true);
      await userStorage.saveCurrentUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("current_user");
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await userStorage.updateUser(user.id, profileData);
      setUser(updatedUser);
      await userStorage.saveCurrentUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, error: error.message };
    }
  };

  // Update coins balance and record transaction
  const updateCoinsBalance = async (amount, type, description) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update user's coins balance
      const updatedUser = {
        ...user,
        coins: (user.coins || 0) + amount,
      };

      // Save updated user
      await userStorage.updateUser(user.id, updatedUser);
      setUser(updatedUser);
      await userStorage.saveCurrentUser(updatedUser);

      // Record transaction in AsyncStorage
      const transactionKey = `coins_transactions_${user.id}`;
      const existingTransactions = await AsyncStorage.getItem(transactionKey);
      const transactions = existingTransactions
        ? JSON.parse(existingTransactions)
        : [];

      const newTransaction = {
        id: Date.now().toString(),
        userId: user.id,
        amount,
        type,
        description,
        date: new Date().toISOString(),
        balance: updatedUser.coins,
      };

      transactions.push(newTransaction);
      await AsyncStorage.setItem(transactionKey, JSON.stringify(transactions));

      return { success: true, transaction: newTransaction };
    } catch (error) {
      console.error("Error updating coins balance:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile: user, // 添加 userProfile 作为 user 的别名
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    signOut: logout, // 添加 signOut 作为 logout 的别名
    updateProfile,
    updateCoinsBalance,
    checkAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
