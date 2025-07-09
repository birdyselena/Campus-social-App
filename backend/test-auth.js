// Simple test to check authController without dependencies
try {
  console.log("Testing authController import...");
  const authController = require("./src/controllers/authController");
  console.log("authController imported successfully");
  console.log("Available methods:", Object.keys(authController));
} catch (error) {
  console.error("Error importing authController:", error.message);
  console.error("Stack:", error.stack);
}
