const User = require('./User');
const Event = require('./Event');
const ChatGroup = require('./ChatGroup');
const Message = require('./Message');
const EventAttendee = require('./EventAttendee');
const ChatGroupMember = require('./ChatGroupMember');
const CoinsTransaction = require('./CoinsTransaction');

// Define associations
const defineAssociations = () => {
  // User - Event associations
  User.hasMany(Event, {
    foreignKey: 'creator_id',
    as: 'createdEvents'
  });
  Event.belongsTo(User, {
    foreignKey: 'creator_id',
    as: 'creator'
  });

  // User - EventAttendee associations
  User.hasMany(EventAttendee, {
    foreignKey: 'user_id',
    as: 'eventAttendances'
  });
  EventAttendee.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Event - EventAttendee associations
  Event.hasMany(EventAttendee, {
    foreignKey: 'event_id',
    as: 'attendees'
  });
  EventAttendee.belongsTo(Event, {
    foreignKey: 'event_id',
    as: 'event'
  });

  // User - ChatGroup associations
  User.hasMany(ChatGroup, {
    foreignKey: 'creator_id',
    as: 'createdGroups'
  });
  ChatGroup.belongsTo(User, {
    foreignKey: 'creator_id',
    as: 'creator'
  });

  // User - ChatGroupMember associations
  User.hasMany(ChatGroupMember, {
    foreignKey: 'user_id',
    as: 'groupMemberships'
  });
  ChatGroupMember.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // ChatGroup - ChatGroupMember associations
  ChatGroup.hasMany(ChatGroupMember, {
    foreignKey: 'group_id',
    as: 'members'
  });
  ChatGroupMember.belongsTo(ChatGroup, {
    foreignKey: 'group_id',
    as: 'group'
  });

  // User - Message associations
  User.hasMany(Message, {
    foreignKey: 'sender_id',
    as: 'sentMessages'
  });
  Message.belongsTo(User, {
    foreignKey: 'sender_id',
    as: 'sender'
  });

  // ChatGroup - Message associations
  ChatGroup.hasMany(Message, {
    foreignKey: 'group_id',
    as: 'messages'
  });
  Message.belongsTo(ChatGroup, {
    foreignKey: 'group_id',
    as: 'group'
  });

  // User - CoinsTransaction associations
  User.hasMany(CoinsTransaction, {
    foreignKey: 'user_id',
    as: 'coinTransactions'
  });
  CoinsTransaction.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Many-to-many associations
  User.belongsToMany(Event, {
    through: EventAttendee,
    foreignKey: 'user_id',
    otherKey: 'event_id',
    as: 'attendedEvents'
  });
  Event.belongsToMany(User, {
    through: EventAttendee,
    foreignKey: 'event_id',
    otherKey: 'user_id',
    as: 'attendeeUsers'
  });

  User.belongsToMany(ChatGroup, {
    through: ChatGroupMember,
    foreignKey: 'user_id',
    otherKey: 'group_id',
    as: 'joinedGroups'
  });
  ChatGroup.belongsToMany(User, {
    through: ChatGroupMember,
    foreignKey: 'group_id',
    otherKey: 'user_id',
    as: 'memberUsers'
  });
};

module.exports = {
  defineAssociations,
  User,
  Event,
  ChatGroup,
  Message,
  EventAttendee,
  ChatGroupMember,
  CoinsTransaction
};
  group_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chat_groups',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator', 'member'),
    defaultValue: 'member'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['group_id', 'user_id']
    }
  ]
});

// Coins Transactions
const CoinsTransaction = sequelize.define('CoinsTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('event_attendance', 'daily_bonus', 'referral', 'purchase', 'redemption', 'admin_adjustment'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  reference_type: {
    type: DataTypes.ENUM('event', 'purchase', 'redemption'),
    allowNull: true
  }
}, {
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = {
  EventAttendee,
  ChatGroupMember,
  CoinsTransaction
};
