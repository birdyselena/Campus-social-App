const express = require("express");
const { validateRequest } = require("../middleware/validation");
const { auth: protect } = require("../middleware/auth");
const authController = require("../controllers/authController");

const router = express.Router();

// Validation schemas
const registerSchema = {
  email: {
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
  password: {
    isLength: {
      options: { min: 8 },
      errorMessage: "Password must be at least 8 characters long",
    },
    matches: {
      options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
      errorMessage:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    },
  },
  full_name: {
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "Full name must be between 2 and 50 characters",
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
  student_id: {
    isLength: {
      options: { min: 5, max: 20 },
      errorMessage: "Student ID must be between 5 and 20 characters",
    },
    trim: true,
  },
};

const loginSchema = {
  email: {
    isEmail: {
      errorMessage: "Please provide a valid email address",
    },
    normalizeEmail: true,
  },
  password: {
    isLength: {
      options: { min: 1 },
      errorMessage: "Password is required",
    },
  },
};

const changePasswordSchema = {
  currentPassword: {
    isLength: {
      options: { min: 1 },
      errorMessage: "Current password is required",
    },
  },
  newPassword: {
    isLength: {
      options: { min: 8 },
      errorMessage: "New password must be at least 8 characters long",
    },
    matches: {
      options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
      errorMessage:
        "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    },
  },
};

// Routes
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post(
  "/change-password",
  protect,
  validateRequest(changePasswordSchema),
  authController.changePassword
);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", protect, authController.resendVerification);

module.exports = router;
