import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// Demo configuration - replace with your actual Supabase project credentials
const supabaseUrl = "https://demo.supabase.co";
const supabaseAnonKey = "demo-key";

// Mock Supabase client for demo purposes
const createMockSupabase = () => {
  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback) => {
        // Mock auth state change
        callback("SIGNED_OUT", null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signUp: ({ email, password }) =>
        Promise.resolve({
          data: { user: { id: "demo-user-id", email } },
          error: null,
        }),
      signInWithPassword: ({ email, password }) =>
        Promise.resolve({
          data: { user: { id: "demo-user-id", email } },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table) => ({
      select: (columns = "*") => ({
        eq: (column, value) => ({
          order: (column, options) => ({
            limit: (count) => Promise.resolve({ data: [], error: null }),
            then: (resolve) => resolve({ data: [], error: null }),
          }),
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve) => resolve({ data: [], error: null }),
        }),
        gte: (column, value) => ({
          order: (column, options) =>
            Promise.resolve({ data: [], error: null }),
          then: (resolve) => resolve({ data: [], error: null }),
        }),
        order: (column, options) => ({
          limit: (count) => Promise.resolve({ data: [], error: null }),
          then: (resolve) => resolve({ data: [], error: null }),
        }),
        limit: (count) => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve) => resolve({ data: [], error: null }),
      }),
      insert: (data) => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "demo-id", ...data[0] },
              error: null,
            }),
        }),
        then: (resolve) => resolve({ data: null, error: null }),
      }),
      update: (data) => ({
        eq: (column, value) => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: (column, value) => Promise.resolve({ data: null, error: null }),
      }),
    }),
    channel: (name) => ({
      on: (event, options, callback) => ({ subscribe: () => {} }),
    }),
    removeChannel: (subscription) => {},
  };
};

export const supabase = createMockSupabase();

// Database table schemas (for reference)
export const TABLES = {
  USERS: "users",
  CHAT_GROUPS: "chat_groups",
  MESSAGES: "messages",
  EVENTS: "events",
  EVENT_ATTENDEES: "event_attendees",
  COINS_TRANSACTIONS: "coins_transactions",
  PARTNER_BRANDS: "partner_brands",
  USER_ENGAGEMENT: "user_engagement",
};
