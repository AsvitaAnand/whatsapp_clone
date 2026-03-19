import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import NavRail from './NavRail';
import ChatWindow from './ChatWindow';
import Sidebar from './Sidebar';
import CallModal from './CallModal';
import CallsTab from './CallsTab';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

const ChatLayout = ({ currentUser, onLogout, theme, onThemeChange }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [callState, setCallState] = useState({ status: 'idle' });
  const [activeTab, setActiveTab] = useState('chats');
  const [showSidebarSettings, setShowSidebarSettings] = useState(false);
  const socketRef = useRef(null);
  const [socketConnection, setSocketConnection] = useState(null);
  const selectedUserRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    setSocketConnection(socketRef.current);
    
    // Register user with socket
    socketRef.current.emit('register_user', currentUser._id);

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      
      if (selectedUserRef.current && selectedUserRef.current._id === message.senderId) {
        socketRef.current.emit('mark_read', { messageIds: [message._id], senderId: message.senderId });
      } else {
        socketRef.current.emit('mark_delivered', message._id, message.senderId);
      }
    });

    socketRef.current.on('message_status_update', (data) => {
      setMessages((prev) => prev.map((msg) => {
        if (data.messageId && msg._id === data.messageId) return { ...msg, status: data.status };
        if (data.messageIds && data.messageIds.includes(msg._id)) return { ...msg, status: data.status };
        return msg;
      }));
    });

    socketRef.current.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [currentUser]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users?currentUserId=${currentUser._id}`);
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/${currentUser._id}/${selectedUser._id}`);
        setMessages(res.data);
        
        const unreadIds = res.data
          .filter(m => m.senderId === selectedUser._id && m.status !== 'read')
          .map(m => m._id);
        
        if (unreadIds.length > 0) {
          socketRef.current.emit('mark_read', { messageIds: unreadIds, senderId: selectedUser._id });
          setMessages(prev => prev.map(m => unreadIds.includes(m._id) ? { ...m, status: 'read' } : m));
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();
  }, [currentUser, selectedUser]);

  const handleSendMessage = async (text, type = 'text', audioData = '', fileData = '', fileName = '') => {
    if (!selectedUser) return;

    const messageData = {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text: text ? text.trim() : '',
      type,
      audioData,
      fileData,
      fileName,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    try {
      const tempId = Date.now().toString();
      setMessages((prev) => [...prev, { ...messageData, _id: tempId }]);

      const res = await axios.post(`${API_URL}/messages`, messageData);
      
      setMessages((prev) => prev.map(m => m._id === tempId ? res.data : m));
      socketRef.current.emit('send_message', res.data);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="chat-layout">
      <CallModal 
        socket={socketConnection}
        currentUser={currentUser}
        callState={callState}
        setCallState={setCallState}
        users={users}
      />
      <div className="chat-container">
        <NavRail 
          currentUser={currentUser} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setShowSidebarSettings(true)}
        />
        <div className="chat-sidebar-container">
          {activeTab === 'chats' ? (
            <Sidebar 
              users={users} 
              currentUser={currentUser} 
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser} 
              onLogout={onLogout}
              onlineUsers={onlineUsers}
              theme={theme}
              onThemeChange={onThemeChange}
              showSettings={showSidebarSettings}
              setShowSettings={setShowSidebarSettings}
            />
          ) : activeTab === 'calls' ? (
            <CallsTab 
              currentUser={currentUser} 
              users={users} 
              onStartCall={(targetId, isVideo) => setCallState({ status: 'calling', target: targetId, isVideo, from: currentUser._id })} 
            />
          ) : (
            <div className="sidebar" style={{ backgroundColor: 'var(--bg-color-main)' }}>
              <div className="sidebar-header" style={{ padding: '20px 16px' }}><h2 style={{color: 'var(--text-color-primary)', margin: 0}}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2></div>
              <div style={{ padding: '20px', color: 'var(--text-color-secondary)' }}>This feature is not supported in the clone yet.</div>
            </div>
          )}
        </div>
        <div className="chat-window-container">
          {selectedUser ? (
            <ChatWindow 
              selectedUser={selectedUser} 
              messages={messages} 
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              isOnline={onlineUsers.includes(selectedUser._id)}
              onStartCall={(isVideo) => setCallState({ status: 'calling', target: selectedUser._id, isVideo })}
            />
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-content">
                <h1>WhatsApp Web</h1>
                <p>Select a chat to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
