// ============================================
// SWITCH TO ChatApp DATABASE
// ============================================
// use ChatApp;

// ============================================
// 1. CREATE USERS COLLECTION
// ============================================
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "passwordHash", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30
        },
        passwordHash: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        lastActive: { bsonType: "date" }
      }
    }
  }
});

// Create index for unique username
db.users.createIndex({ username: 1 }, { unique: true });

// ============================================
// 2. CREATE CHATS COLLECTION
// ============================================
db.createCollection("chats", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatType", "participants", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        chatType: {
          enum: ["direct", "group"]
        },
        chatName: { bsonType: "string" },
        participants: {
          bsonType: "array",
          items: { bsonType: "objectId" },
          minItems: 2
        },
        createdAt: { bsonType: "date" },
        lastMessageAt: { bsonType: "date" },
        lastMessage: { bsonType: "string" }
      }
    }
  }
});

// Create indexes for chats
db.chats.createIndex({ participants: 1, chatType: 1 });
db.chats.createIndex({ lastMessageAt: -1 });

// ============================================
// 3. CREATE MESSAGES COLLECTION
// ============================================
db.createCollection("messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatId", "senderId", "content", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        chatId: { bsonType: "objectId" },
        senderId: { bsonType: "objectId" },
        content: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// Create indexes for messages
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ chatId: 1 });

// ============================================
// VERIFY COLLECTIONS WERE CREATED
// ============================================
db.getCollectionNames();