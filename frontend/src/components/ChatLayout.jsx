import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import NavRail from './NavRail';
import ChatWindow from './ChatWindow';
import Sidebar from './Sidebar';
import CallModal from './CallModal';
import CallsTab from './CallsTab';
import StatusSidebar from './StatusSidebar';
import StatusViewer from './StatusViewer';
import CommunitiesSidebar from './CommunitiesSidebar';
import MetaAIChat from './MetaAIChat';

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
  const [selectedStatusUser, setSelectedStatusUser] = useState(null);
  const [statusRefreshTrigger, setStatusRefreshTrigger] = useState(0);
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
      
      setUsers((prevUsers) => {
        const isGroup = prevUsers.find(u => u._id === message.receiverId && u.isGroup);
        const contactId = isGroup ? message.receiverId : message.senderId;
        
        const idx = prevUsers.findIndex(u => u._id === contactId);
        if (idx !== -1) {
          const updatedUser = { ...prevUsers[idx] };
          updatedUser.lastMessage = message;
          if (selectedUserRef.current && selectedUserRef.current._id === contactId) {
            // currently open
          } else {
            updatedUser.unreadCount = (updatedUser.unreadCount || 0) + 1;
          }
          const nextUsers = [...prevUsers];
          nextUsers.splice(idx, 1);
          nextUsers.unshift(updatedUser);
          return nextUsers;
        }
        return prevUsers;
      });
      
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

    socketRef.current.on('user_offline', ({ userId, lastSeen }) => {
      setUsers(prev => prev.map(u => String(u._id) === String(userId) ? { ...u, lastSeen } : u));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/conversations/${currentUser._id}`);
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

        // Clear the unread badge in the sidebar when the chat is opened
        setUsers(prevUsers => prevUsers.map(u => 
          u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
        ));

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

      setUsers((prevUsers) => {
        const idx = prevUsers.findIndex(u => u._id === selectedUser._id);
        if (idx !== -1) {
          const updatedUser = { ...prevUsers[idx], lastMessage: messageData, unreadCount: 0 };
          const nextUsers = [...prevUsers];
          nextUsers.splice(idx, 1);
          nextUsers.unshift(updatedUser);
          return nextUsers;
        }
        return prevUsers;
      });

      const res = await axios.post(`${API_URL}/messages`, messageData);
      
      setMessages((prev) => prev.map(m => m._id === tempId ? res.data : m));
      socketRef.current.emit('send_message', res.data);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleUserAction = async (contactId, action, value) => {
    try {
      await axios.post(`${API_URL}/users/action`, {
        userId: currentUser._id,
        contactId,
        action,
        value
      });
      setUsers(prev => prev.map(u => {
        if (u._id === contactId) {
          const key = action === 'archive' ? 'isArchived' : action === 'block' ? 'isBlocked' : 'isMuted';
          return { ...u, [key]: value };
        }
        return u;
      }));
    } catch (err) { console.error(err); }
  };

  const handleClearChat = async (contactId) => {
    try {
      await axios.delete(`${API_URL}/messages/${currentUser._id}/${contactId}`);
      setMessages([]);
      setUsers(prev => prev.map(u => {
        if (u._id === contactId) {
          return { ...u, lastMessage: null };
        }
        return u;
      }));
    } catch (err) { console.error(err); }
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
          unreadCount={users.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0)}
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
          ) : activeTab === 'communities' ? (
            <CommunitiesSidebar />
          ) : activeTab === 'meta-ai' ? (
            <div className="sidebar" style={{ backgroundColor: 'var(--bg-color-main)' }}>
              <div className="sidebar-header" style={{ padding: '20px 16px' }}><h2 style={{color: 'var(--text-color-primary)', margin: 0}}>Meta AI</h2></div>
              <div style={{ padding: '20px', color: 'var(--text-color-secondary)' }}>You are chatting with a simulated AI bot.</div>
            </div>
          ) : activeTab === 'status' ? (
            <StatusSidebar 
              currentUser={currentUser} 
              onSelectStatusUser={setSelectedStatusUser}
              refreshTrigger={statusRefreshTrigger}
            />
          ) : (
            <div className="sidebar" style={{ backgroundColor: 'var(--bg-color-main)' }}>
              <div className="sidebar-header" style={{ padding: '20px 16px' }}><h2 style={{color: 'var(--text-color-primary)', margin: 0}}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2></div>
              <div style={{ padding: '20px', color: 'var(--text-color-secondary)' }}>This feature is not supported in the clone yet.</div>
            </div>
          )}
        </div>
        <div className="chat-window-container">
          {activeTab === 'meta-ai' ? (
             <MetaAIChat />
          ) : activeTab === 'status' ? (
             <StatusViewer 
                selectedStatusUser={selectedStatusUser} 
                currentUser={currentUser} 
                onClose={() => setSelectedStatusUser(null)} 
                onStatusAdded={() => setStatusRefreshTrigger(prev => prev + 1)}
             />
          ) : activeTab === 'communities' ? (
            <div className="chat-empty">
              <div className="chat-empty-content">
                <h1>Communities</h1>
                <p>Stay connected with your community groups and announcements.</p>
              </div>
            </div>
          ) : selectedUser ? (
            <ChatWindow 
              selectedUser={users.find(u => String(u._id) === String(selectedUser._id)) || selectedUser} 
              messages={messages} 
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              isOnline={onlineUsers.includes(selectedUser._id)}
              onStartCall={(isVideo) => setCallState({ status: 'calling', target: selectedUser._id, isVideo })}
              users={users}
              socket={socketConnection}
              onUserAction={handleUserAction}
              onClearChat={handleClearChat}
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
