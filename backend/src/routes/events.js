const express = require("express");
const { validateRequest } = require("../middleware/validation");
const { protect } = require("../middleware/auth");
const eventController = require("../controllers/eventController");

const router = express.Router();

// Validation schemas
const createEventSchema = {
  title: {
    isLength: {
      options: { min: 3, max: 100 },
      errorMessage: "Event title must be between 3 and 100 characters",
    },
    trim: true,
  },
  description: {
    isLength: {
      options: { min: 10, max: 1000 },
      errorMessage: "Event description must be between 10 and 1000 characters",
    },
    trim: true,
  },
  date: {
    isISO8601: {
      errorMessage: "Please provide a valid date",
    },
    custom: {
      options: (value) => {
        const eventDate = new Date(value);
        const now = new Date();
        if (eventDate <= now) {
          throw new Error("Event date must be in the future");
        }
        return true;
      },
    },
  },
  location: {
    isLength: {
      options: { min: 3, max: 200 },
      errorMessage: "Event location must be between 3 and 200 characters",
    },
    trim: true,
  },
  category: {
    isIn: {
      options: [
        [
          "academic",
          "social",
          "sports",
          "cultural",
          "career",
          "workshop",
          "seminar",
          "other",
        ],
      ],
      errorMessage: "Please select a valid category",
    },
  },
  max_participants: {
    isInt: {
      options: { min: 1, max: 10000 },
      errorMessage: "Maximum participants must be between 1 and 10000",
    },
  },
  is_free: {
    isBoolean: {
      errorMessage: "is_free must be a boolean value",
    },
  },
  price: {
    optional: true,
    isFloat: {
      options: { min: 0 },
      errorMessage: "Price must be a positive number",
    },
  },
  university: {
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "University name must be between 2 and 100 characters",
    },
    trim: true,
  },
};

const updateEventSchema = {
  title: {
    optional: true,
    isLength: {
      options: { min: 3, max: 100 },
      errorMessage: "Event title must be between 3 and 100 characters",
    },
    trim: true,
  },
  description: {
    optional: true,
    isLength: {
      options: { min: 10, max: 1000 },
      errorMessage: "Event description must be between 10 and 1000 characters",
    },
    trim: true,
  },
  date: {
    optional: true,
    isISO8601: {
      errorMessage: "Please provide a valid date",
    },
    custom: {
      options: (value) => {
        const eventDate = new Date(value);
        const now = new Date();
        if (eventDate <= now) {
          throw new Error("Event date must be in the future");
        }
        return true;
      },
    },
  },
  location: {
    optional: true,
    isLength: {
      options: { min: 3, max: 200 },
      errorMessage: "Event location must be between 3 and 200 characters",
    },
    trim: true,
  },
  category: {
    optional: true,
    isIn: {
      options: [
        [
          "academic",
          "social",
          "sports",
          "cultural",
          "career",
          "workshop",
          "seminar",
          "other",
        ],
      ],
      errorMessage: "Please select a valid category",
    },
  },
  max_participants: {
    optional: true,
    isInt: {
      options: { min: 1, max: 10000 },
      errorMessage: "Maximum participants must be between 1 and 10000",
    },
  },
  is_free: {
    optional: true,
    isBoolean: {
      errorMessage: "is_free must be a boolean value",
    },
  },
  price: {
    optional: true,
    isFloat: {
      options: { min: 0 },
      errorMessage: "Price must be a positive number",
    },
  },
};

// Routes
router.get("/", eventController.getAllEvents);
router.get("/my-events", protect, eventController.getMyEvents);
router.get("/search", eventController.searchEvents);
router.get("/:id", eventController.getEventById);
router.post(
  "/",
  protect,
  validateRequest(createEventSchema),
  eventController.createEvent
);
router.put(
  "/:id",
  protect,
  validateRequest(updateEventSchema),
  eventController.updateEvent
);
router.delete("/:id", protect, eventController.deleteEvent);

// Event attendance
router.post("/:id/attend", protect, eventController.attendEvent);
router.delete("/:id/attend", protect, eventController.unattendEvent);
router.get("/:id/attendees", eventController.getEventAttendees);

// Event feedback
router.post("/:id/feedback", protect, eventController.submitFeedback);
router.get("/:id/feedback", eventController.getEventFeedback);

module.exports = router;
