# WhatsApp Web Clone (MERN + Socket.IO)

A full-stack, real-time WhatsApp Web clone built using MongoDB, Express.js, React.js, Node.js, and Socket.IO.

## Features Supported
- **Real-time Messaging**: Instant messaging utilizing Socket.IO for seamless 1-on-1 and Group chats.
- **Message Management**: Start, reply, edit, and delete messages (for everyone).
- **Message Reactions**: React to messages using an emoji tray, updated in real-time.
- **Group Chats**: Create groups, manage group info, add/remove members (Admin only).
- **Typing Indicators**: Real-time "typing..." status for both individual and group chats.
- **Media & File Sharing**: Send images and files with integrated download links.
- **Voice Messaging**: Record and send voice notes directly from the chat interface.
- **WebRTC Calling**: Real-time Voice and Video calls with ringing UI, offline detection, and active call toggles.
- **Chat Management**: Archive, mute, block, and delete conversations.
- **Modern UI/UX**: Pixel-perfect adherence to the newest WhatsApp Web design, including the left Navigation Rail, animated emoji pickers, custom wallpapers, and floating scroll-to-bottom buttons.
- **Read Receipts**: Real-time tracking of sent, delivered, and read status (single and double ticks).
- **Simulated Meta AI & Communities**: UI foundations laid for AI bot chats and community announcements.

## Prerequisites
Before running this project, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)
- Git

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd whastup_clone
   ```

2. **Setup the Backend:**
   Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file inside the `backend` folder (if it doesn't exist):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/whatsapp-clone
   ```
   Start the backend server:
   ```bash
   npm run dev 
   # OR
   node server.js
   ```
   *(Note: Using `nodemon` or `npm run dev` is highly recommended for development to auto-reload on changes).*

3. **Setup the Frontend:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   ```
   Start the React development server:
   ```bash
   npm run dev
   ```

## How to Login (Testing Accounts)

The backend automatically seeds test accounts on the first run. There is no complex password hashing for demonstration purposes, making it easy to test interactions between multiple users simultaneously in different incognito tabs.

Use any of the following accounts:
- **Email:** `arjun@test.com` | **Password:** `password123`
- **Email:** `asvita@test.com` | **Password:** `password123`
- **Email:** `megharaj@test.com`| **Password:** `password123`
- **Email:** `margani@test.com` | **Password:** `password123`
- **Email:** `nandini@test.com` | **Password:** `password123`
- **Email:** `alice@test.com`   | **Password:** `password123`
- **Email:** `boopesh@test.com` | **Password:** `password123`

## Technical Architecture & Logic

- **Database (MongoDB)**: Stores Users, Messages, and Status updates. The `Message` schema includes fields for `reactions`, `isEdited`, `isDeleted`, and `replyTo`.
- **Backend (Express + Node)**: Provides REST API endpoints for initial data fetching (chat history, user list, group management).
- **Real-Time (Socket.IO)**: Sits on top of the Express server. Handles live broadcasting of `send_message`, `edit_message`, `delete_message`, `react_message`, `typing`, and message read receipts (`mark_read`, `mark_delivered`). Events are securely routed using a `userSocketMap` that links MongoDB user IDs to active Socket IDs.
- **Frontend (React)**: Component-based architecture. State synchronization is carefully managed: when the user performs an action (e.g., editing a message), an API call is made, local React state is eagerly updated to ensure zero-latency UI feedback, and a Socket event is emitted to synchronize the receiver's screen.
- **WebRTC**: Used for Peer-to-Peer Voice and Video calling, coordinated via signaling events over Socket.IO (`webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`).