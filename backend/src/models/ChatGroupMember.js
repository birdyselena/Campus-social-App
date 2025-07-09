const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChatGroupMember = sequelize.define(
  "ChatGroupMember",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ChatGroup",
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
    role: {
      type: DataTypes.ENUM("admin", "member"),
      defaultValue: "member",
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_read_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["group_id", "user_id"],
      },
      {
        fields: ["group_id"],
      },
      {
        fields: ["user_id"],
      },
    ],
  }
);

module.exports = ChatGroupMember;
