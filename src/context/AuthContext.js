import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Mock user profile for demo
        const mockProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: userData.fullName,
          university: userData.university,
          student_id: userData.studentId,
          coins_balance: 100, // Start with 100 coins for demo
          created_at: new Date().toISOString(),
        };

        setUser(data.user);
        setUserProfile(mockProfile);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.user) {
        // Mock user profile for demo
        const mockProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: "Demo Student",
          university: "Demo University",
          student_id: "DEMO123",
          coins_balance: 150, // Demo coins balance
          created_at: new Date().toISOString(),
        };

        setUser(data.user);
        setUserProfile(mockProfile);
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateCoinsBalance = async (amount, transactionType, description) => {
    if (!user) return { error: "User not authenticated" };

    try {
      // Update local coins balance for demo
      const newBalance = (userProfile?.coins_balance || 0) + amount;

      // Update local state
      setUserProfile((prev) => ({
        ...prev,
        coins_balance: Math.max(0, newBalance), // Ensure balance doesn't go negative
      }));

      return { error: null, newBalance: Math.max(0, newBalance) };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateCoinsBalance,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
