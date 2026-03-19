import React, { useState, useEffect, useRef } from 'react';
import { MdSend, MdPerson, MdCall, MdVideocam, MdMoreVert, MdEmojiEmotions, MdAttachFile, MdMic, MdStop, MdCheck, MdDoneAll } from 'react-icons/md';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = ({ selectedUser, messages, currentUser, onSendMessage, isOnline, onStartCall, users, socket }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setTypingUsers(new Set());
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;
    
    const handleTyping = (data) => {
      if (data.receiverId === selectedUser._id) {
         setTypingUsers(prev => new Set(prev).add(data.senderId));
      }
    };
    
    const handleStopTyping = (data) => {
      if (data.receiverId === selectedUser._id) {
         setTypingUsers(prev => {
           const next = new Set(prev);
           next.delete(data.senderId);
           return next;
         });
      }
    };

    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, selectedUser]);

  const onEmojiClick = (emojiObject) => {
    setInputText(prev => prev + emojiObject.emoji);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText, 'text', '');
      setInputText('');
      setShowEmojiPicker(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      const isImage = file.type.startsWith('image/');
      const msgType = isImage ? 'image' : 'file';
      
      onSendMessage(isImage ? '📷 Photo' : file.name, msgType, '', base64Data, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64AudioMessage = reader.result;
          onSendMessage('[Voice Message]', 'audio', base64AudioMessage);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // alert("Could not access microphone."); 
      // some browsers block this if not localhost or https
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (dateString) => {
    try {
      if (!dateString) return '';
      return format(new Date(dateString), 'hh:mm a');
    } catch {
      return '';
    }
  };

  const renderTicks = (status) => {
    if (status === 'sent') return <MdCheck size={16} color="#8696a0" style={{marginLeft: 4, verticalAlign: 'text-bottom'}}/>;
    if (status === 'delivered') return <MdDoneAll size={16} color="#8696a0" style={{marginLeft: 4, verticalAlign: 'text-bottom'}}/>;
    if (status === 'read') return <MdDoneAll size={16} color="#53bdeb" style={{marginLeft: 4, verticalAlign: 'text-bottom'}}/>;
    return <MdCheck size={16} color="#8696a0" style={{marginLeft: 4, verticalAlign: 'text-bottom'}}/>;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const chatMessages = messages.filter(msg => {
    if (selectedUser.isGroup) {
      return msg.receiverId === selectedUser._id;
    }
    return (msg.senderId === currentUser._id && msg.receiverId === selectedUser._id) ||
           (msg.senderId === selectedUser._id && msg.receiverId === currentUser._id);
  });

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left" onClick={() => selectedUser.isGroup && setShowGroupInfo(true)} style={{cursor: selectedUser.isGroup ? 'pointer' : 'default'}}>
          <div className="avatar">
            {selectedUser.profilePic ? <img src={selectedUser.profilePic} alt="" /> : <MdPerson size={24} color="#54656f" />}
          </div>
          <div className="chat-header-info">
            <h3>{selectedUser.username}</h3>
            {typingUsers.size > 0 ? (
              <span className="online-status" style={{color: 'var(--accent-color)', fontStyle: 'italic', fontWeight: 'bold'}}>
                {selectedUser.isGroup 
                  ? Array.from(typingUsers).map(id => users?.find(u => String(u._id) === String(id))?.username).filter(Boolean).join(', ') + ' typing...'
                  : 'typing...'}
              </span>
            ) : selectedUser.isGroup ? (
              <span className="online-status" style={{fontSize: '12px', opacity: 0.8}}>
                {selectedUser.members?.map(mId => String(mId) === String(currentUser._id) ? 'You' : users?.find(u => String(u._id) === String(mId))?.username || `Unknown`).filter(Boolean).join(', ')}
              </span>
            ) : isOnline && <span className="online-status">online</span>}
          </div>
        </div>
        <div className="chat-header-right">
          <button className="icon-btn" title="Video call" onClick={() => onStartCall(true)}><MdVideocam size={24} /></button>
          <button className="icon-btn" title="Voice call" onClick={() => onStartCall(false)}><MdCall size={20} /></button>
          <div className="vertical-divider"></div>
          <button className="icon-btn" title="Menu" onClick={() => selectedUser.isGroup && setShowGroupInfo(true)}><MdMoreVert size={24} /></button>
        </div>
      </div>
      
      {showGroupInfo && selectedUser.isGroup && (
        <div className="group-info-modal" style={{position: 'absolute', top: 60, right: 10, width: 300, backgroundColor: 'var(--bg-color-panel)', zIndex: 100, boxShadow: 'var(--shadow-md)', borderRadius: 10, padding: 15, animation: 'slideIn 0.2s'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
            <h3 style={{color: 'var(--text-color-primary)', margin: 0}}>Group Info</h3>
            <button className="icon-btn" onClick={() => setShowGroupInfo(false)} style={{padding: 0}}>✕</button>
          </div>
          <p style={{color: 'var(--accent-color)', fontSize: 13, marginBottom: 5}}>Group Admin:</p>
          <p style={{color: 'var(--text-color-primary)', marginBottom: 15}}>
            {String(selectedUser.groupAdmin) === String(currentUser._id) ? 'You' : users?.find(u => String(u._id) === String(selectedUser.groupAdmin))?.username || `Unknown Admin`}
          </p>
          <p style={{color: 'var(--accent-color)', fontSize: 13, marginBottom: 5}}>Members ({selectedUser.members?.length}):</p>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-color-primary)', maxHeight: 200, overflowY: 'auto'}}>
            {selectedUser.members?.map(mId => {
              const u = users?.find(tu => String(tu._id) === String(mId));
              return <li key={mId} style={{padding: '5px 0', borderBottom: '1px solid var(--border-color)'}}>{String(mId) === String(currentUser._id) ? 'You' : u?.username || `Unknown Member`}</li>;
            })}
          </ul>
        </div>
      )}

      <div className="messages-container">
        {chatMessages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser._id;
          const senderUser = selectedUser.isGroup && !isOwn ? users?.find(u => u._id === msg.senderId) : null;
          return (
            <div key={index} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
              <div className="message-bubble">
                {selectedUser.isGroup && !isOwn && senderUser && (
                  <span style={{color: 'var(--accent-color)', fontSize: '13px', fontWeight: 'bold', paddingBottom: '4px'}}>{senderUser.username}</span>
                )}
                {msg.type === 'audio' ? (
                  <div className="audio-message">
                    <audio controls src={msg.audioData} style={{height: '35px', outline: 'none'}} />
                  </div>
                ) : msg.type === 'image' ? (
                  <div className="image-message">
                    <img src={msg.fileData} alt="Shared" />
                  </div>
                ) : msg.type === 'file' ? (
                  <div className="file-message">
                    <a href={msg.fileData} download={msg.fileName} className="file-download-link">
                      <div className="file-icon"><MdAttachFile size={24} /></div>
                      <div className="file-info">
                        <span className="file-name">{msg.fileName}</span>
                        <span className="file-action">Download</span>
                      </div>
                    </a>
                  </div>
                ) : (
                  <p className="message-text">{msg.text}</p>
                )}
                <span className="message-time">
                  {formatTime(msg.timestamp || msg.createdAt)}
                  {isOwn && renderTicks(msg.status || 'sent')}
                </span>
                {isOwn && (
                  <svg viewBox="0 0 16 15" width="16" height="15" className="message-tail">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a3.2 3.2 0 0 1-.484.373c-.352.23-.625.432-1.055.432-.429 0-.698-.205-1.047-.432-.158-.103-.321-.219-.5-.353l-.36-.263a2.95 2.95 0 0 1-.4-.36l-3.32-4.156a.365.365 0 0 0-.51-.063l-.478.372a.365.365 0 0 0-.063.51l3.52 4.407c.219.26.471.493.743.684.341.24.646.455 1.137.455.49 0 .796-.215 1.136-.455.22-.151.458-.352.66-.54l5.447-7.258a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker-wrapper">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height={350} />
        </div>
      )}

      <div className="chat-input-container">
        {!isRecording ? (
          <>
            <input 
              type="file" 
              style={{display: 'none'}} 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <button type="button" className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <MdEmojiEmotions size={26} />
            </button>
            <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()}>
              <MdAttachFile size={26} />
            </button>
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
              <input 
                type="text" 
                placeholder="Type a message" 
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (socket) {
                    socket.emit('typing', { senderId: currentUser._id, receiverId: selectedUser._id, isGroup: !!selectedUser.isGroup });
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      socket.emit('stop_typing', { senderId: currentUser._id, receiverId: selectedUser._id, isGroup: !!selectedUser.isGroup });
                    }, 2000);
                  }
                }}
                onClick={() => setShowEmojiPicker(false)}
              />
            </form>
            {inputText.trim() ? (
              <button type="button" className="send-btn" onClick={handleSubmit}>
                <MdSend size={24} />
              </button>
            ) : (
              <button type="button" className="icon-btn action-btn mic-btn" onClick={startRecording}>
                <MdMic size={24} />
              </button>
            )}
          </>
        ) : (
          <div className="recording-container">
            <div className="recording-indicator">
              <div className="red-dot"></div>
              <span>{formatDuration(recordingTime)}</span>
            </div>
            <button type="button" className="send-btn stop-record-btn" onClick={stopRecording}>
              <MdStop size={32} color="#ef5350" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
