const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, CoinsTransaction } = require("../models");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const { createResponse, calculateCoins } = require("../utils/helpers");
const { logger } = require("../utils/logger");

const authController = {
  // Register new user
  register: catchAsync(async (req, res) => {
    const { email, password, full_name, university, date_of_birth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      full_name,
      university,
      date_of_birth,
      coins_balance: 100, // Initial coins
    });

    // Create welcome bonus transaction
    await CoinsTransaction.create({
      user_id: user.id,
      amount: 100,
      transaction_type: "welcome_bonus",
      description: "Welcome bonus",
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json(
      createResponse("success", "User registered successfully", {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          university: user.university,
          coins_balance: user.coins_balance,
        },
        token,
      })
    );
  }),

  // Login user
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    logger.info(`User logged in: ${user.email}`);

    res.json(
      createResponse("success", "Logged in successfully", {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          university: user.university,
          coins_balance: user.coins_balance,
        },
        token,
      })
    );
  }),

  // Refresh token
  refreshToken: catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        throw new AppError("Invalid refresh token", 401);
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json(
        createResponse("success", "Token refreshed successfully", {
          token: newToken,
        })
      );
    } catch (error) {
      throw new AppError("Invalid refresh token", 401);
    }
  }),

  // Forgot password
  forgotPassword: catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // In a real application, you would send this token via email
    // For now, we'll just return it in the response
    logger.info(`Password reset requested for user: ${user.email}`);

    res.json(
      createResponse("success", "Password reset token generated", {
        resetToken,
        message: "Check your email for password reset instructions",
      })
    );
  }),

  // Reset password
  resetPassword: catchAsync(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== "password_reset") {
        throw new AppError("Invalid reset token", 400);
      }

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user password
      await user.update({ password: hashedPassword });

      logger.info(`Password reset for user: ${user.email}`);

      res.json(createResponse("success", "Password reset successfully"));
    } catch (error) {
      throw new AppError("Invalid or expired reset token", 400);
    }
  }),

  // Verify email
  verifyEmail: catchAsync(async (req, res) => {
    const { token } = req.params;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== "email_verification") {
        throw new AppError("Invalid verification token", 400);
      }

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      await user.update({ is_verified: true });

      logger.info(`Email verified for user: ${user.email}`);

      res.json(createResponse("success", "Email verified successfully"));
    } catch (error) {
      throw new AppError("Invalid or expired verification token", 400);
    }
  }),

  // Resend verification email
  resendVerification: catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.is_verified) {
      throw new AppError("Email is already verified", 400);
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: "email_verification" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // In a real application, you would send this token via email
    logger.info(`Verification email resent for user: ${user.email}`);

    res.json(
      createResponse("success", "Verification email sent", {
        verificationToken,
        message: "Check your email for verification instructions",
      })
    );
  }),

  // Get current user profile
  getProfile: catchAsync(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json(createResponse("success", "Profile retrieved successfully", user));
  }),

  // Update user profile
  updateProfile: catchAsync(async (req, res) => {
    const { full_name, university, date_of_birth } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await user.update({
      full_name: full_name || user.full_name,
      university: university || user.university,
      date_of_birth: date_of_birth || user.date_of_birth,
    });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    logger.info(`Profile updated for user: ${user.email}`);

    res.json(
      createResponse("success", "Profile updated successfully", updatedUser)
    );
  }),

  // Change password
  changePassword: catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ password: hashedNewPassword });

    logger.info(`Password changed for user: ${user.email}`);

    res.json(createResponse("success", "Password changed successfully"));
  }),

  // Get user's coins balance
  getCoinsBalance: catchAsync(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: ["coins_balance"],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json(
      createResponse("success", "Coins balance retrieved successfully", {
        coins_balance: user.coins_balance,
      })
    );
  }),

  // Get user's coins transactions
  getCoinsTransactions: catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: transactions } =
      await CoinsTransaction.findAndCountAll({
        where: { user_id: req.user.id },
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

    const meta = {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    };

    res.json(
      createResponse(
        "success",
        "Coins transactions retrieved successfully",
        transactions,
        meta
      )
    );
  }),

  // Logout user
  logout: catchAsync(async (req, res) => {
    // In a stateless JWT system, logout is typically handled client-side
    // But you could implement token blacklisting here if needed
    logger.info(`User logged out: ${req.user.email}`);

    res.json(createResponse("success", "Logged out successfully"));
  }),
};

module.exports = authController;
