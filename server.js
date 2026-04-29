import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = "mongodb+srv://ranabiswajit911:VXZ7D2T3vKN7i1rR@cluster0.iouiweb.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db("ChatApp");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

connectDB();

// JWT Secret
const JWT_SECRET = "your-secret-key-change-this-in-production";

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const users = db.collection("users");
    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const result = await users.insertOne({
      username,
      passwordHash,
      createdAt: new Date(),
      lastActive: new Date()
    });

    const token = jwt.sign(
      { id: result.insertedId.toString(), username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "User registered successfully",
      token,
      user: { id: result.insertedId, username }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const users = db.collection("users");
    const user = await users.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last active
    await users.updateOne({ _id: user._id }, { $set: { lastActive: new Date() } });

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER ROUTES
// ============================================

// Get all users (for searching)
app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const users = db.collection("users");

    const searchQuery = query
      ? { username: { $regex: query, $options: "i" } }
      : {};

    const results = await users
      .find(searchQuery)
      .project({ username: 1, _id: 1 })
      .limit(20)
      .toArray();

    // Filter out current user
    const filtered = results.filter(u => u._id.toString() !== req.user.id);

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get("/api/users/me", authenticateToken, async (req, res) => {
  try {
    const users = db.collection("users");
    const user = await users.findOne({ _id: ObjectId.createFromHexString(req.user.id) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: user._id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete current user and all related chats/messages
app.delete("/api/users/me", authenticateToken, async (req, res) => {
  try {
    const currentUserId = ObjectId.createFromHexString(req.user.id);
    const users = db.collection("users");
    const chats = db.collection("chats");
    const messages = db.collection("messages");
    const currentUser = await users.findOne({ _id: currentUserId });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const relatedChats = await chats
      .find({ participants: currentUserId })
      .project({ _id: 1, chatType: 1 })
      .toArray();

    const directChatIds = relatedChats
      .filter((chat) => chat.chatType === "direct")
      .map((chat) => chat._id);
    const groupChatIds = relatedChats
      .filter((chat) => chat.chatType === "group")
      .map((chat) => chat._id);

    // Preserve deleted user's display in existing group messages.
    await messages.updateMany(
      { senderId: currentUserId, senderNameSnapshot: { $exists: false } },
      { $set: { senderNameSnapshot: `Deleted user(${currentUser.username})` } }
    );

    if (directChatIds.length > 0) {
      await messages.deleteMany({ chatId: { $in: directChatIds } });
      await chats.deleteMany({ _id: { $in: directChatIds } });
    }

    // Keep groups alive, only remove the deleted user from participants.
    if (groupChatIds.length > 0) {
      await chats.updateMany(
        { _id: { $in: groupChatIds } },
        { $pull: { participants: currentUserId } }
      );
    }

    const userDeleteResult = await users.deleteOne({ _id: currentUserId });

    if (!userDeleteResult.deletedCount) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Account deleted. Direct chats removed and group chats preserved." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CHAT ROUTES
// ============================================

// Create or get direct chat
app.post("/api/chats/direct", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = ObjectId.createFromHexString(req.user.id);
    const otherObjectId = ObjectId.createFromHexString(otherUserId);

    const chats = db.collection("chats");

    // Check if chat already exists
    let chat = await chats.findOne({
      chatType: "direct",
      participants: { $all: [currentUserId, otherObjectId] }
    });

    if (!chat) {
      const result = await chats.insertOne({
        chatType: "direct",
        participants: [currentUserId, otherObjectId],
        createdAt: new Date(),
        lastMessageAt: new Date(),
        lastMessage: ""
      });
      chat = { _id: result.insertedId, ...chats };
    }

    res.json({ id: chat._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create group chat
app.post("/api/chats/group", authenticateToken, async (req, res) => {
  try {
    const { chatName, participantIds } = req.body;
    const currentUserId = ObjectId.createFromHexString(req.user.id);

    const participants = [
      currentUserId,
      ...participantIds.map(id => ObjectId.createFromHexString(id))
    ];

    const chats = db.collection("chats");
    const result = await chats.insertOne({
      chatType: "group",
      chatName,
      participants,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      lastMessage: ""
    });

    res.json({ id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's chats
app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    const currentUserId = ObjectId.createFromHexString(req.user.id);
    const chats = db.collection("chats");
    const users = db.collection("users");

    const userChats = await chats
      .find({ participants: currentUserId })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Enrich with user information
    const enrichedChats = await Promise.all(
      userChats.map(async (chat) => {
        const otherParticipants = chat.participants.filter(
          p => p.toString() !== currentUserId.toString()
        );

        if (chat.chatType === "direct") {
          const otherUser = await users.findOne({ _id: otherParticipants[0] });
          return {
            _id: chat._id,
            chatType: "direct",
            chatName: otherUser?.username || "Deleted Chat",
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            participants: chat.participants
          };
        } else {
          return {
            _id: chat._id,
            chatType: "group",
            chatName: chat.chatName,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            participants: chat.participants
          };
        }
      })
    );

    res.json(enrichedChats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a chat and all its messages
app.delete("/api/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = ObjectId.createFromHexString(req.user.id);
    const chatObjectId = ObjectId.createFromHexString(chatId);
    const chats = db.collection("chats");
    const messages = db.collection("messages");

    const chat = await chats.findOne({ _id: chatObjectId });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const isParticipant = chat.participants.some(
      (participant) => participant.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "Not allowed to delete this chat" });
    }

    await messages.deleteMany({ chatId: chatObjectId });
    await chats.deleteOne({ _id: chatObjectId });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MESSAGE ROUTES
// ============================================

// Get messages for a chat
app.get("/api/messages/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = db.collection("messages");
    const users = db.collection("users");

    const chatMessages = await messages
      .find({ chatId: ObjectId.createFromHexString(chatId) })
      .sort({ createdAt: 1 })
      .toArray();

    // Enrich with sender info
    const enrichedMessages = await Promise.all(
      chatMessages.map(async (msg) => {
        const sender = await users.findOne({ _id: msg.senderId });
        return {
          _id: msg._id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: sender?.username || msg.senderNameSnapshot || "Deleted user",
          createdAt: msg.createdAt
        };
      })
    );

    res.json(enrichedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const senderId = ObjectId.createFromHexString(req.user.id);
    const chatObjectId = ObjectId.createFromHexString(chatId);

    const messages = db.collection("messages");
    const chats = db.collection("chats");
    const chat = await chats.findOne({ _id: chatObjectId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // In direct chats, a user must wait for the other participant to reply
    // before sending another message.
    if (chat.chatType === "direct") {
      const lastMessage = await messages.findOne(
        { chatId: chatObjectId },
        { sort: { createdAt: -1 } }
      );

      if (lastMessage && lastMessage.senderId.toString() === senderId.toString()) {
        return res.status(429).json({
          error: "Wait for the other user to reply before sending another message."
        });
      }
    }

    // Insert message
    const result = await messages.insertOne({
      chatId: chatObjectId,
      senderId,
      content,
      senderNameSnapshot: req.user.username,
      createdAt: new Date()
    });

    // Update chat's last message
    await chats.updateOne(
      { _id: chatObjectId },
      {
        $set: {
          lastMessage: content,
          lastMessageAt: new Date()
        }
      }
    );

    res.json({
      _id: result.insertedId,
      content,
      senderId,
      senderName: req.user.username,
      createdAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SOCKET.IO SETUP
// ============================================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a chat room
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
  });

  // Listen for new messages
  socket.on("send-message", (data) => {
    io.to(data.chatId).emit("new-message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
