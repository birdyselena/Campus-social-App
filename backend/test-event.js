// Test eventController import
try {
  console.log("Testing eventController import...");
  const eventController = require("./src/controllers/eventController");
  console.log("eventController imported successfully");
  console.log("Available methods:", Object.keys(eventController));

  console.log("\nMethod checks:");
  console.log("getAllEvents:", typeof eventController.getAllEvents);
  console.log("getMyEvents:", typeof eventController.getMyEvents);
  console.log("searchEvents:", typeof eventController.searchEvents);
  console.log("getEventById:", typeof eventController.getEventById);
  console.log("createEvent:", typeof eventController.createEvent);
  console.log("updateEvent:", typeof eventController.updateEvent);
  console.log("deleteEvent:", typeof eventController.deleteEvent);
  console.log("attendEvent:", typeof eventController.attendEvent);
  console.log("unattendEvent:", typeof eventController.unattendEvent);
  console.log("getEventAttendees:", typeof eventController.getEventAttendees);
  console.log("submitFeedback:", typeof eventController.submitFeedback);
  console.log("getEventFeedback:", typeof eventController.getEventFeedback);
} catch (error) {
  console.error("Error importing eventController:", error.message);
  console.error("Stack:", error.stack);
}
