const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    university: Joi.string().required(),
    student_id: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100),
    university: Joi.string(),
    student_id: Joi.string(),
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).required(),
  }),
};

// Event validation schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().required(),
    date: Joi.date().greater("now").required(),
    location: Joi.string().required(),
    coins_reward: Joi.number().min(0).max(1000).default(0),
    max_attendees: Joi.number().min(1),
    category: Joi.string()
      .valid(
        "academic",
        "social",
        "sports",
        "cultural",
        "professional",
        "other"
      )
      .default("other"),
    tags: Joi.array().items(Joi.string()),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string(),
    date: Joi.date().greater("now"),
    location: Joi.string(),
    coins_reward: Joi.number().min(0).max(1000),
    max_attendees: Joi.number().min(1),
    category: Joi.string().valid(
      "academic",
      "social",
      "sports",
      "cultural",
      "professional",
      "other"
    ),
    tags: Joi.array().items(Joi.string()),
  }),
};

// ChatGroup validation schemas
const chatGroupSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string(),
    is_public: Joi.boolean().default(true),
    max_members: Joi.number().min(2).max(1000).default(1000),
    category: Joi.string()
      .valid(
        "academic",
        "social",
        "sports",
        "cultural",
        "professional",
        "other"
      )
      .default("other"),
    tags: Joi.array().items(Joi.string()),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string(),
    is_public: Joi.boolean(),
    max_members: Joi.number().min(2).max(1000),
    category: Joi.string().valid(
      "academic",
      "social",
      "sports",
      "cultural",
      "professional",
      "other"
    ),
    tags: Joi.array().items(Joi.string()),
  }),
};

// Message validation schemas
const messageSchemas = {
  create: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    reply_to: Joi.string().uuid(),
  }),
};

module.exports = {
  validateRequest,
  userSchemas,
  eventSchemas,
  chatGroupSchemas,
  messageSchemas,
};
