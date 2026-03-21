# WhatsApp Web Clone

A full-stack, real-time WhatsApp Web clone built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io. This project features a modern responsive UI (including the new WhatsApp vertical navigation rail) and replicates many core features of the actual WhatsApp application.

## 🌟 Features

- **Real-Time Messaging:** Instant message delivery using Socket.io.
- **Group Chats:** Create groups, view members, and chat with multiple people.
- **Media & File Sharing:** Send images, documents, and other files easily.
- **Voice Messages:** Built-in microphone recording to send voice notes.
- **Status Updates:** Share text or image statuses that automatically disappear after 24 hours.
- **Online & Last Seen:** See when your contacts are online or when they were last active.
- **Message Status Indicators:** Real-time ticks for Sent, Delivered, and Read receipts.
- **Chat Management:** Archive, mute, block, and delete chats just like the real app.
- **Customization options:** 
  - Change chat wallpapers for individual contacts.
  - Light/Dark theme toggle for the Emoji Keyboard.
- **Meta AI Chat:** A simulated AI bot chat feature.
- **Modern UI:** Features the sleek new left-side vertical Navigation Rail to switch between Chats, Status, Communities, Calls, and Meta AI.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/en/download/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally, or use a MongoDB Atlas cluster)
- Git (if cloning from the repository)

### Installation

#### 1. Get the Code
You can either clone the repository using Git or download it as a ZIP file.

**Option A - Clone via Git:**
```bash
git clone https://github.com/AsvitaAnand/whatsapp_clone.git
cd whatsapp_clone
```

**Option B - Download as ZIP:**
- Click the green **Code** button at the top right of this page and select **Download ZIP**.
- Extract the ZIP file and open the extracted folder in your terminal.

#### 2. Setup the Backend
Open a terminal and navigate to the backend directory:
```bash
cd backend
```
Install backend dependencies:
```bash
npm install
```
Start the backend server:
```bash
node server.js
# Or use 'npm run dev' if nodemon is configured
```
*(The backend should now be running on port 5000 and connected to MongoDB).*

#### 3. Setup the Frontend
Open a **new** terminal window and navigate to the frontend directory:
```bash
cd frontend
```
Install frontend dependencies:
```bash
npm install
```
Start the frontend Vite development server:
```bash
npm run dev
```

### 4. Open the App
Once both servers are running, open your browser and navigate to the URL provided by the Vite server (usually `http://localhost:5173`).

---

## 🛠️ Built With

- **Frontend:** React.js, Vite, CSS, React Icons, Emoji-Picker-React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Real-time Engine:** Socket.io
- **Utilities:** date-fns, axios

## 📄 License
This project is open-source and available under the MIT License.
