# 🚀 ChatApp Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies

Make sure you have Node.js installed (v18+), then run:

```bash
npm install
```

This will install all required packages including Express, MongoDB driver, React, Socket.io, etc.

### Step 2: Update Server Configuration

Edit `server.js` line 17 and update the MongoDB connection string if needed:

```javascript
const uri = "mongodb+srv://ranabiswajit911:VXZ7D2T3vKN7i1rR@cluster0.iouiweb.mongodb.net/?appName=Cluster0";
```

**Important:** For production, move this to a `.env` file:

```bash
# Create .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=your-secret-key-here
```

Then update server.js to use:
```javascript
const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
```

### Step 3: Run the Application

**Option A: Run Frontend Only (Development)**
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

**Option B: Run Both Backend + Frontend (Recommended)**
```bash
npm run server
```
In another terminal:
```bash
npm run dev
```

Backend: http://localhost:5000
Frontend: http://localhost:5173

**Option C: Run with Both in One Command**
```bash
npm run dev:all
```
(Requires `concurrently` to be installed)

### Step 4: Create Test Users

1. Open http://localhost:5173
2. Click "Sign up" 
3. Create 2-3 test accounts with different usernames
4. Try creating chats between them!

---

## 📊 Database Schema

The app uses these MongoDB collections:

### `users`
- `_id`: ObjectId
- `username`: String (unique)
- `passwordHash`: String (bcrypt)
- `createdAt`: Date
- `lastActive`: Date

### `chats`
- `_id`: ObjectId
- `chatType`: "direct" | "group"
- `chatName`: String (for groups)
- `participants`: [ObjectId] (user IDs)
- `createdAt`: Date
- `lastMessageAt`: Date
- `lastMessage`: String (preview)

### `messages`
- `_id`: ObjectId
- `chatId`: ObjectId (reference to chat)
- `senderId`: ObjectId (reference to user)
- `content`: String
- `createdAt`: Date

---

## 🎯 Features

✅ **User Registration & Login** - Username/password based (no email needed)
✅ **Direct Chats** - 1-on-1 messaging
✅ **Group Chats** - Messaging with multiple users  
✅ **User Search** - Find and chat with other users
✅ **Chat List** - See all your chats with last message preview
✅ **Real-time Messages** - Messages refresh every 2 seconds
✅ **Beautiful UI** - Modern, responsive design

---

## 📱 Project Structure

```
Chat-app/
├── server.js                 # Backend Express server
├── package.json
├── src/
│   ├── App.tsx              # Main app component
│   ├── App.css
│   ├── main.tsx
│   ├── pages/
│   │   ├── Login.tsx        # Login/Register page
│   │   └── ChatDashboard.tsx # Main chat page
│   ├── components/
│   │   ├── ChatList.tsx     # List of chats
│   │   ├── ChatWindow.tsx   # Message display & input
│   │   └── NewChatModal.tsx # User search modal
│   └── styles/
│       ├── Auth.css
│       ├── Dashboard.css
│       ├── ChatList.css
│       ├── ChatWindow.css
│       └── Modal.css
```

---

## 🔧 Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/search?query=username` - Search users

### Chats
- `POST /api/chats/direct` - Create/get direct chat
- `POST /api/chats/group` - Create group chat
- `GET /api/chats` - Get user's chats

### Messages
- `GET /api/messages/:chatId` - Get messages in chat
- `POST /api/messages` - Send message

---

## 🐛 Troubleshooting

**DNS Connection Error when starting server?**
The DNS fix is already in `server.js`. If still having issues:
```javascript
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
```

**CORS errors?**
Make sure both backend and frontend are running:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

**Messages not updating?**
Frontend polls every 2 seconds. For real-time, integrate Socket.io (code is prepared in server.js).

**Can't create chat?**
1. Make sure both users exist
2. Check token is valid (login fresh)
3. Verify MongoDB connection

---

## 🚀 Next Steps / Enhancements

- [ ] Real-time messaging with Socket.io
- [ ] Upload profile pictures
- [ ] Typing indicators
- [ ] Message read receipts
- [ ] Delete account option
- [ ] Change password
- [ ] Group chat settings
- [ ] Dark mode theme

---

## 📝 Notes

- Passwords are hashed with bcryptjs before storing
- JWT tokens expire in 7 days
- All passwords should be at least 6 characters
- Usernames must be 3-30 characters
- No email verification required (simple setup)

---

## 💡 Tips

1. For production, use environment variables for sensitive data
2. Add rate limiting to prevent spam
3. Implement message pagination
4. Add message search functionality
5. Use Socket.io for real-time updates
6. Add message encryption for privacy

Enjoy your ChatApp! 💬
