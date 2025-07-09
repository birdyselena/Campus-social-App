const { Event, User, EventAttendee, CoinsTransaction } = require("../models");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const {
  createResponse,
  paginate,
  getPaginationMeta,
  calculateCoins,
} = require("../utils/helpers");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

const eventController = {
  // Get all events with pagination and filtering
  getAllEvents: catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      category,
      university,
      search,
      sortBy = "date",
      order = "ASC",
    } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    let whereClause = {};

    // Apply filters
    if (category) {
      whereClause.category = category;
    }

    if (university) {
      whereClause.university = { [Op.iLike]: `%${university}%` };
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Only show future events by default
    whereClause.date = { [Op.gte]: new Date() };

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
        {
          model: EventAttendee,
          as: "attendees",
          attributes: ["id", "user_id"],
        },
      ],
      order: [[sortBy, order.toUpperCase()]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse("success", "Events retrieved successfully", events, meta)
    );
  }),

  // Get events created by the current user
  getMyEvents: catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: events } = await Event.findAndCountAll({
      where: { creator_id: req.user.id },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
        {
          model: EventAttendee,
          as: "attendees",
          attributes: ["id", "user_id"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Your events retrieved successfully",
        events,
        meta
      )
    );
  }),

  // Search events
  searchEvents: catchAsync(async (req, res) => {
    const {
      q,
      category,
      university,
      date_from,
      date_to,
      page = 1,
      limit = 10,
    } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    if (!q) {
      throw new AppError("Search query is required", 400);
    }

    let whereClause = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ],
    };

    if (category) {
      whereClause.category = category;
    }

    if (university) {
      whereClause.university = { [Op.iLike]: `%${university}%` };
    }

    if (date_from || date_to) {
      whereClause.date = {};
      if (date_from) whereClause.date[Op.gte] = new Date(date_from);
      if (date_to) whereClause.date[Op.lte] = new Date(date_to);
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
        {
          model: EventAttendee,
          as: "attendees",
          attributes: ["id", "user_id"],
        },
      ],
      order: [["date", "ASC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Search results retrieved successfully",
        events,
        meta
      )
    );
  }),

  // Get event by ID
  getEventById: catchAsync(async (req, res) => {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university", "email"],
        },
        {
          model: EventAttendee,
          as: "attendees",
          include: [
            {
              model: User,
              attributes: ["id", "full_name", "university"],
            },
          ],
        },
      ],
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    res.json(createResponse("success", "Event retrieved successfully", event));
  }),

  // Create new event
  createEvent: catchAsync(async (req, res) => {
    const eventData = {
      ...req.body,
      creator_id: req.user.id,
    };

    const event = await Event.create(eventData);

    // Award coins for creating an event
    const coinAmount = calculateCoins("event_create");
    await CoinsTransaction.create({
      user_id: req.user.id,
      amount: coinAmount,
      transaction_type: "event_create",
      description: `Created event: ${event.title}`,
      reference_id: event.id,
    });

    // Update user's coin balance
    await User.increment("coins_balance", {
      by: coinAmount,
      where: { id: req.user.id },
    });

    const createdEvent = await Event.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
      ],
    });

    logger.info(`Event created: ${event.title} by user ${req.user.id}`);

    res
      .status(201)
      .json(
        createResponse("success", "Event created successfully", createdEvent)
      );
  }),

  // Update event
  updateEvent: catchAsync(async (req, res) => {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Check if user is the creator
    if (event.creator_id !== req.user.id) {
      throw new AppError("You can only update your own events", 403);
    }

    // Check if event has already started
    if (new Date(event.date) <= new Date()) {
      throw new AppError("Cannot update events that have already started", 400);
    }

    await event.update(req.body);

    const updatedEvent = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "university"],
        },
      ],
    });

    logger.info(`Event updated: ${event.title} by user ${req.user.id}`);

    res.json(
      createResponse("success", "Event updated successfully", updatedEvent)
    );
  }),

  // Delete event
  deleteEvent: catchAsync(async (req, res) => {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Check if user is the creator
    if (event.creator_id !== req.user.id) {
      throw new AppError("You can only delete your own events", 403);
    }

    await event.destroy();

    logger.info(`Event deleted: ${event.title} by user ${req.user.id}`);

    res.json(createResponse("success", "Event deleted successfully"));
  }),

  // Attend event
  attendEvent: catchAsync(async (req, res) => {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Check if event has already started
    if (new Date(event.date) <= new Date()) {
      throw new AppError("Cannot attend events that have already started", 400);
    }

    // Check if user is already attending
    const existingAttendance = await EventAttendee.findOne({
      where: {
        event_id: id,
        user_id: req.user.id,
      },
    });

    if (existingAttendance) {
      throw new AppError("You are already attending this event", 400);
    }

    // Check if event is full
    const attendeeCount = await EventAttendee.count({
      where: { event_id: id },
    });

    if (attendeeCount >= event.max_participants) {
      throw new AppError("Event is full", 400);
    }

    await EventAttendee.create({
      event_id: id,
      user_id: req.user.id,
    });

    // Award coins for attending an event
    const coinAmount = calculateCoins("event_attend");
    await CoinsTransaction.create({
      user_id: req.user.id,
      amount: coinAmount,
      transaction_type: "event_attend",
      description: `Attended event: ${event.title}`,
      reference_id: event.id,
    });

    // Update user's coin balance
    await User.increment("coins_balance", {
      by: coinAmount,
      where: { id: req.user.id },
    });

    logger.info(`User ${req.user.id} attended event ${id}`);

    res.json(createResponse("success", "Successfully registered for event"));
  }),

  // Unattend event
  unattendEvent: catchAsync(async (req, res) => {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Check if event has already started
    if (new Date(event.date) <= new Date()) {
      throw new AppError(
        "Cannot unattend events that have already started",
        400
      );
    }

    const attendance = await EventAttendee.findOne({
      where: {
        event_id: id,
        user_id: req.user.id,
      },
    });

    if (!attendance) {
      throw new AppError("You are not attending this event", 400);
    }

    await attendance.destroy();

    logger.info(`User ${req.user.id} unattended event ${id}`);

    res.json(createResponse("success", "Successfully unregistered from event"));
  }),

  // Get event attendees
  getEventAttendees: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { limit: queryLimit, offset } = paginate(page, limit);

    const event = await Event.findByPk(id);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const { count, rows: attendees } = await EventAttendee.findAndCountAll({
      where: { event_id: id },
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "university", "profile_picture"],
        },
      ],
      order: [["created_at", "ASC"]],
      limit: queryLimit,
      offset,
    });

    const meta = getPaginationMeta(count, page, limit);

    res.json(
      createResponse(
        "success",
        "Event attendees retrieved successfully",
        attendees,
        meta
      )
    );
  }),

  // Submit event feedback
  submitFeedback: catchAsync(async (req, res) => {
    // This would require a separate Feedback model
    // For now, we'll return a placeholder response
    res.json(createResponse("success", "Feedback submitted successfully"));
  }),

  // Get event feedback
  getEventFeedback: catchAsync(async (req, res) => {
    // This would require a separate Feedback model
    // For now, we'll return a placeholder response
    res.json(
      createResponse("success", "Event feedback retrieved successfully", [])
    );
  }),
};

module.exports = eventController;
