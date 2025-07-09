const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
const { sequelize } = require("./models");
const { globalErrorHandler } = require("./middleware/errorHandler");
const { logger } = require("./utils/logger");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");
const coinsRoutes = require("./routes/coins");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:19006",
    methods: ["GET", "POST"],
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  morgan("combined", { stream: { write: (message) => logger.info(message) } })
);
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Campus Social API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coins", coinsRoutes);

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join chat group
  socket.on("joinGroup", (groupId) => {
    socket.join(`group_${groupId}`);
    logger.info(`User ${socket.id} joined group ${groupId}`);
  });

  // Leave chat group
  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group_${groupId}`);
    logger.info(`User ${socket.id} left group ${groupId}`);
  });

  // Handle new message
  socket.on("sendMessage", (data) => {
    socket.to(`group_${data.groupId}`).emit("newMessage", data);
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    socket.to(`group_${data.groupId}`).emit("userTyping", data);
  });

  socket.on("stopTyping", (data) => {
    socket.to(`group_${data.groupId}`).emit("userStoppedTyping", data);
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io accessible to our router
app.set("io", io);

// Global error handler
app.use(globalErrorHandler);

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Database connection
    await sequelize.authenticate();
    logger.info("Database connected successfully");

    // Sync database (only in development)
    if (process.env.NODE_ENV === "development") {
      // await sequelize.sync({ alter: true });
      logger.info("Database sync disabled temporarily");
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
