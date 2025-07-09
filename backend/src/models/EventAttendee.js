const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EventAttendee = sequelize.define(
  "EventAttendee",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Event",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },
    attended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["event_id", "user_id"],
      },
      {
        fields: ["event_id"],
      },
      {
        fields: ["user_id"],
      },
    ],
  }
);

module.exports = EventAttendee;
