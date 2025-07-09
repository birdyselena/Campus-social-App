const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CoinsTransaction = sequelize.define(
  "CoinsTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        not: 0,
      },
    },
    transaction_type: {
      type: DataTypes.ENUM(
        "daily_bonus",
        "event_create",
        "event_attend",
        "group_create",
        "message_send",
        "profile_complete",
        "referral",
        "transfer_in",
        "transfer_out",
        "redemption",
        "admin_adjustment"
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Reference to related entity (event, group, etc.)",
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "User balance after this transaction",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional transaction metadata",
    },
  },
  {
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["transaction_type"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["reference_id"],
      },
    ],
  }
);

module.exports = CoinsTransaction;
