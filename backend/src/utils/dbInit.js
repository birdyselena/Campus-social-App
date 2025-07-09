const { sequelize } = require("../models");
const { logger } = require("../utils/logger");

const initDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    // Sync all models to database
    // In production, you should use migrations instead
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ force: false, alter: true });
      logger.info("Database synchronized successfully.");
    }

    // Create admin user if not exists
    const { User } = require("../models");
    const adminUser = await User.findOne({
      where: { email: "admin@campus.com" },
    });

    if (!adminUser) {
      await User.create({
        email: "admin@campus.com",
        password: "Admin123!",
        full_name: "System Administrator",
        university: "Campus Social",
        student_id: "ADMIN001",
        is_verified: true,
        is_admin: true,
        coins_balance: 10000,
      });
      logger.info("Admin user created successfully.");
    }

    logger.info("Database initialization completed.");
  } catch (error) {
    logger.error("Database initialization failed:", error);
    process.exit(1);
  }
};

module.exports = { initDatabase };
