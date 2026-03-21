import React, { useState, useRef, useEffect } from 'react';
import { MdSend } from 'react-icons/md';

const MetaAIChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Hi! I'm Meta AI. How can I help you today?", timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: `This is a simulated AI response to: "${userMsg.text}". I am a mock AI inside this clone!`, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-window">
      <div className="chat-header" style={{ backgroundColor: 'var(--bg-color-panel)', padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(45deg, #128C7E, #25D366, #34B7F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
          <div className="meta-ai-circle" style={{ width: 24, height: 24, border: '3px solid white', borderTopColor: 'transparent', margin: 0, animation: 'spin 2s linear infinite' }}></div>
        </div>
        <h3 style={{ margin: 0, color: 'var(--text-color-primary)', fontSize: 18 }}>Meta AI</h3>
      </div>

      <div className="messages-container" style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: 'var(--bg-color-main)', backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover' }}>
        {messages.map(msg => (
          <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'own' : 'other'}`}>
            <div className="message-bubble" style={{ maxWidth: '70%', background: msg.sender === 'user' ? 'var(--accent-color)' : 'var(--bg-color-panel)', color: msg.sender === 'user' ? '#fff' : 'var(--text-color-primary)', padding: '8px 12px', borderRadius: 8, position: 'relative' }}>
              <p className="message-text" style={{ margin: 0, fontSize: 15 }}>{msg.text}</p>
              <span className="message-time" style={{ fontSize: 11, color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-color-secondary)', float: 'right', marginTop: 4, marginLeft: 10 }}>{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container" style={{ backgroundColor: 'var(--bg-color-panel)', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Meta AI anything" 
            style={{ flex: 1, padding: '12px 15px', borderRadius: 8, border: 'none', backgroundColor: 'var(--bg-color-main)', color: 'var(--text-color-primary)', fontSize: 15, outline: 'none' }}
          />
        </form>
        {inputText.trim() && (
          <button type="button" className="send-btn" onClick={handleSubmit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdSend size={24} color="#8696a0" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MetaAIChat;
