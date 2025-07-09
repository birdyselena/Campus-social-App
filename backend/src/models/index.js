const sequelize = require("../config/database");
const { defineAssociations } = require("./newAssociations");
const User = require("./User");
const Event = require("./Event");
const ChatGroup = require("./ChatGroup");
const Message = require("./Message");
const EventAttendee = require("./EventAttendee");
const ChatGroupMember = require("./ChatGroupMember");
const CoinsTransaction = require("./CoinsTransaction");

// Define all associations
defineAssociations();

module.exports = {
  sequelize,
  User,
  Event,
  ChatGroup,
  Message,
  EventAttendee,
  ChatGroupMember,
  CoinsTransaction,
};
