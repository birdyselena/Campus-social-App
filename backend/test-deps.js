// Test each dependency individually
console.log("Testing middleware/errorHandler...");
try {
  const { AppError, catchAsync } = require("./src/middleware/errorHandler");
  console.log("✓ errorHandler imported successfully");
  console.log("AppError:", typeof AppError);
  console.log("catchAsync:", typeof catchAsync);
} catch (error) {
  console.error("✗ Error importing errorHandler:", error.message);
}

console.log("\nTesting utils/helpers...");
try {
  const { createResponse, calculateCoins } = require("./src/utils/helpers");
  console.log("✓ helpers imported successfully");
  console.log("createResponse:", typeof createResponse);
  console.log("calculateCoins:", typeof calculateCoins);
} catch (error) {
  console.error("✗ Error importing helpers:", error.message);
}

console.log("\nTesting utils/logger...");
try {
  const { logger } = require("./src/utils/logger");
  console.log("✓ logger imported successfully");
  console.log("logger:", typeof logger);
} catch (error) {
  console.error("✗ Error importing logger:", error.message);
}

console.log("\nTesting models...");
try {
  const { User, CoinsTransaction } = require("./src/models");
  console.log("✓ models imported successfully");
  console.log("User:", typeof User);
  console.log("CoinsTransaction:", typeof CoinsTransaction);
} catch (error) {
  console.error("✗ Error importing models:", error.message);
}
