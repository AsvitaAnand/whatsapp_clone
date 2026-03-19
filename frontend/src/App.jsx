import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('whatsapp_clone_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('whatsapp_clone_theme') || 'dark-theme');

  useEffect(() => {
    localStorage.setItem('whatsapp_clone_theme', theme);
  }, [theme]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('whatsapp_clone_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('whatsapp_clone_user');
  };

  return (
    <Router>
      <div className={`app ${theme}`}>
        <Routes>
          <Route 
            path="/login" 
            element={!currentUser ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={currentUser ? <ChatLayout currentUser={currentUser} onLogout={handleLogout} theme={theme} onThemeChange={setTheme} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
