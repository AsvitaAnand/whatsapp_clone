<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Logo" width="80" />
  <h1>WhatsApp Web Clone</h1>
  
  <p>
    A full-stack, real-time WhatsApp Web clone built with the <strong>MERN</strong> stack and <strong>Socket.IO</strong>.
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#usage--test-accounts">How to Use</a> •
    <a href="#architecture">Architecture</a>
  </p>
</div>

---

## 🚀 Features

This project faithfully replicates the core real-time functionalities and modern aesthetic of WhatsApp Web:

*   ⚡ **Real-time Messaging**: Instant, zero-latency messaging using WebSockets. Supports both 1-on-1 and Group chats.
*   🔄 **Message Management**: Start new chats, reply to specific messages, edit sent messages, and delete messages (for everyone).
*   😀 **Message Reactions**: React to any message using an integrated emoji tray that updates in real-time.
*   👥 **Group Chats & Admin Controls**: Create groups, manage group information, and add or remove members seamlessly.
*   ⌨️ **Typing Indicators**: Live "typing..." status indicators for both individual and group conversations.
*   📎 **Media & File Sharing**: Send images and documents with integrated download links and previews.
*   🎤 **Voice Messaging**: Record and send voice notes directly from the chat interface with a modern recording UI.
*   📞 **WebRTC Calling**: Real-time Peer-to-Peer Voice and Video calls complete with ringing UI, offline detection, and active call toggles.
*   🗂️ **Chat Management**: Archive, mute, block, and delete entire conversation threads.
*   ✔️ **Read Receipts**: Real-time tracking of message status—sent (single tick), delivered (double tick), and read (blue ticks).
*   🎨 **Modern Aesthetic UI/UX**: Pixel-perfect adherence to the newest WhatsApp Web design. Features the left Navigation Rail, responsive flex layouts, glassmorphism elements, animated emoji pickers, custom wallpapers, and scroll-to-bottom buttons.
*   🤖 **AI & Communities UI**: Foundations laid down for simulated Meta AI bot chats and community announcement spaces.

---

## 🛠 Tech Stack

**Frontend**
*   [React.js](https://reactjs.org/) (Vite)
*   [Socket.IO-client](https://socket.io/) for real-time events
*   Vanilla CSS (CSS Variables, Flexbox, Grid) for maximum performance and customizability
*   [emoji-picker-react](https://www.npmjs.com/package/emoji-picker-react) for native emoji integration
*   [date-fns](https://date-fns.org/) for chat timestamp formatting

**Backend**
*   [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
*   [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) for database architecture
*   [Socket.IO](https://socket.io/) for WebSocket event broadcasting
*   [WebRTC](https://webrtc.org/) signaling over WebSockets for voice/video calls

---

## 🏁 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [MongoDB](https://www.mongodb.com/) (running locally on default port 27017, or a MongoDB Atlas URI)
*   Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AsvitaAnand/whatsapp_clone.git
   cd whastup_clone
   ```

2. **Setup the Backend:**
   Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file inside the `backend` folder:
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

---

## 🧪 Usage & Test Accounts

The backend automatically seeds test accounts and generates default placeholder profile pictures (using UI Avatars) on the first run. 

There is no complex password hashing implemented, specifically to prioritize easy demonstration and rapid testing across multiple incognito browser tabs.

**Available Test Accounts:**
*   **Email:** `alice@test.com`   | **Password:** `password123`
*   **Email:** `boopesh@test.com` | **Password:** `password123`
*   **Email:** `charlie@test.com` | **Password:** `password123`
*   **Email:** `dave@test.com`    | **Password:** `password123`
*   **Email:** `asvita@test.com`  | **Password:** `password123`
*   **Email:** `megharaj@test.com`| **Password:** `password123`

**Pro Tip:** Open two different browsers (or one normal and one incognito window) and log in as two different users (e.g., Alice and Boopesh) to test the real-time chatting and read receipts!

---

## 📐 Architecture & Logic Flow

*   **Database Schema**: Designed via Mongoose. The `transient` Chat states are derived from `Message` documents, reducing duplication. Messages include `reactions`, `isEdited`, `isDeleted`, and `replyTo`. Profile configurations and Last Seen timestamps live in the `User` schema.
*   **REST + WebSockets**: The Express REST API handles initial, heavy data-fetching payloads (like historical chat histories, user lists, and group meta-management). Lightweight, high-frequency granular updates (typing, message sending, reading, and reacting) happen exclusively over Socket.IO.
*   **Socket Registry Map**: To ensure secure and exact message routing, the backend maintains a `userSocketMap` mapping active MongoDB User IDs to volatile Socket Session IDs. Multi-device support can be configured by mapping arrays of Socket IDs.
*   **State Synchronization**: React's component state is eagerly evaluated. When an action occurs (like sending an emoji), the UI updates locally instantly, while simultaneously pinging the REST API and emitting a Socket event to synchronize the receiver.
*   **WebRTC Signaling**: WebRTC is negotiated entirely over the WebSocket pipeline, exchanging standard `'webrtc_offer'`, `'webrtc_answer'`, and `'webrtc_ice_candidate'` signals efficiently without polling.

---

> Built for educational purposes, demonstrating full-stack architecture, WebSocket event management, and complex React state handling.