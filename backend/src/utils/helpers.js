const crypto = require("crypto");

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Format date
const formatDate = (date) => {
  return new Date(date).toISOString();
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Paginate results
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

// Calculate pagination metadata
const getPaginationMeta = (count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems: count,
    itemsPerPage: parseInt(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// Filter and sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
};

// Create response format
const createResponse = (status, message, data = null, meta = null) => {
  const response = {
    status,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return response;
};

// Handle async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Calculate coins for activity
const calculateCoins = (activityType) => {
  const coinRates = {
    event_create: 50,
    event_attend: 25,
    group_create: 30,
    message_send: 1,
    daily_login: 10,
    profile_complete: 100,
    referral: 200,
  };

  return coinRates[activityType] || 0;
};

// Generate referral code
const generateReferralCode = (userId) => {
  const timestamp = Date.now().toString(36);
  const userHash = crypto
    .createHash("md5")
    .update(userId.toString())
    .digest("hex")
    .substr(0, 4);
  return `REF${timestamp}${userHash}`.toUpperCase();
};

module.exports = {
  generateId,
  generateRandomString,
  formatDate,
  isValidEmail,
  isValidPassword,
  paginate,
  getPaginationMeta,
  sanitizeInput,
  createResponse,
  asyncHandler,
  calculateCoins,
  generateReferralCode,
};
