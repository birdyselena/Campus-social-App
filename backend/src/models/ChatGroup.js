const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChatGroup = sequelize.define(
  "ChatGroup",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    university: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    creator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    member_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    max_members: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
        "academic",
        "social",
        "sports",
        "cultural",
        "professional",
        "other"
      ),
      defaultValue: "other",
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        fields: ["university"],
      },
      {
        fields: ["created_by"],
      },
      {
        fields: ["category"],
      },
      {
        fields: ["is_public"],
      },
    ],
  }
);

module.exports = ChatGroup;
