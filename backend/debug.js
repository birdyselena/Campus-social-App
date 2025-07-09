const authController = require("./src/controllers/authController");

console.log("authController:", authController);
console.log("authController.register:", authController.register);
console.log("authController.login:", authController.login);
console.log("authController.logout:", authController.logout);
console.log("authController.refreshToken:", authController.refreshToken);
console.log("authController.forgotPassword:", authController.forgotPassword);
console.log("authController.resetPassword:", authController.resetPassword);
console.log("authController.changePassword:", authController.changePassword);
console.log("authController.verifyEmail:", authController.verifyEmail);
console.log(
  "authController.resendVerification:",
  authController.resendVerification
);
