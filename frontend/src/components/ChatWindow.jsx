import React, { useState, useEffect, useRef } from 'react';
import { MdSend, MdPerson, MdCall, MdVideocam, MdMoreVert, MdEmojiEmotions, MdAttachFile, MdMic, MdStop, MdCheck, MdDoneAll, MdKeyboardArrowDown, MdSearch, MdGroup, MdBrightness4, MdBrightness7 } from 'react-icons/md';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = ({ selectedUser, messages, currentUser, onSendMessage, isOnline, onStartCall, users, socket, onUserAction, onClearChat }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState('');
  const [emojiTheme, setEmojiTheme] = useState(() => localStorage.getItem('whatsapp_emoji_theme') || 'dark');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollButton(!isAtBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setTypingUsers(new Set());
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      const storedWallpapers = JSON.parse(localStorage.getItem('whatsapp_wallpapers') || '{}');
      setChatWallpaper(storedWallpapers[selectedUser._id] || '');
      setShowMenu(false);
    }
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

  const formatLastSeen = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isToday(d)) return `today at ${format(d, 'h:mm a')}`;
      if (isYesterday(d)) return `yesterday at ${format(d, 'h:mm a')}`;
      return format(d, 'dd/MM/yyyy');
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

  const handleWallpaperSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setChatWallpaper(base64);
        const storedWallpapers = JSON.parse(localStorage.getItem('whatsapp_wallpapers') || '{}');
        storedWallpapers[selectedUser._id] = base64;
        localStorage.setItem('whatsapp_wallpapers', JSON.stringify(storedWallpapers));
        setShowMenu(false);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  const handleRemoveWallpaper = () => {
    setChatWallpaper('');
    const storedWallpapers = JSON.parse(localStorage.getItem('whatsapp_wallpapers') || '{}');
    delete storedWallpapers[selectedUser._id];
    localStorage.setItem('whatsapp_wallpapers', JSON.stringify(storedWallpapers));
    setShowMenu(false);
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
            ) : isOnline ? (
              <span className="online-status">online</span>
            ) : (
              <span className="online-status">
                {selectedUser.lastSeen ? `last seen ${formatLastSeen(selectedUser.lastSeen)}` : 'offline'}
              </span>
            )}
          </div>
        </div>
        <div className="chat-header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="icon-btn" title="Video call" onClick={() => onStartCall(true)}><MdVideocam size={24} /></button>
          <button className="icon-btn" title="Voice call" onClick={() => onStartCall(false)}><MdCall size={20} /></button>
          <div className="vertical-divider"></div>
          <button className="icon-btn" title="Search"><MdSearch size={22} /></button>
          {selectedUser.isGroup && (
             <button className="icon-btn" onClick={() => setShowGroupInfo(true)} title="Group Info">
               <MdGroup size={22} />
             </button>
          )}
          <div style={{ position: 'relative' }}>
             <button className="icon-btn" onClick={() => setShowMenu(!showMenu)} title="Menu"><MdMoreVert size={22} /></button>
             {showMenu && (
               <div style={{ position: 'absolute', top: 40, right: 0, backgroundColor: 'var(--bg-color-main)', border: '1px solid var(--border-color)', borderRadius: 5, boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 100, minWidth: 180, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <button onClick={() => wallpaperInputRef.current?.click()} style={{ padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-color-primary)', cursor: 'pointer', fontSize: 14 }}>Change Wallpaper</button>
                  {chatWallpaper && <button onClick={handleRemoveWallpaper} style={{ padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 14 }}>Remove Wallpaper</button>}
                  <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '5px 0' }} />
                  <button onClick={() => { onUserAction(selectedUser._id, 'archive', !selectedUser.isArchived); setShowMenu(false); }} style={{ padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-color-primary)', cursor: 'pointer', fontSize: 14 }}>{selectedUser.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</button>
                  <button onClick={() => { onUserAction(selectedUser._id, 'mute', !selectedUser.isMuted); setShowMenu(false); }} style={{ padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-color-primary)', cursor: 'pointer', fontSize: 14 }}>{selectedUser.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</button>
                  <button onClick={() => { onClearChat(selectedUser._id); setShowMenu(false); }} style={{ padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 14 }}>Delete Chat</button>
                  {!selectedUser.isGroup && (
                    <button onClick={() => { onUserAction(selectedUser._id, 'block', !selectedUser.isBlocked); setShowMenu(false); }} style={{ padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 14 }}>{selectedUser.isBlocked ? 'Unblock Contact' : 'Block Contact'}</button>
                  )}
               </div>
             )}
          </div>
          <input type="file" ref={wallpaperInputRef} style={{display: 'none'}} accept="image/*" onChange={handleWallpaperSelected} />
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

      <div 
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={chatWallpaper ? { backgroundImage: `url(${chatWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}
      >
        {chatMessages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser._id;
          const senderUser = selectedUser.isGroup && !isOwn ? users?.find(u => u._id === msg.senderId) : null;
          
          const msgDate = new Date(msg.timestamp || msg.createdAt);
          const prevMsg = index > 0 ? chatMessages[index - 1] : null;
          const prevDate = prevMsg ? new Date(prevMsg.timestamp || prevMsg.createdAt) : null;
          const showDateDivider = !prevDate || !isSameDay(msgDate, prevDate);
          
          let dateText = '';
          if (showDateDivider) {
            if (isToday(msgDate)) dateText = 'Today';
            else if (isYesterday(msgDate)) dateText = 'Yesterday';
            else dateText = format(msgDate, 'dd/MM/yyyy');
          }

          return (
            <React.Fragment key={index}>
              {showDateDivider && (
                <div className="date-divider-wrapper">
                  <span className="date-divider">{dateText}</span>
                </div>
              )}
              <div className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
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
          </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button 
          className="scroll-bottom-btn" 
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <MdKeyboardArrowDown size={26} />
        </button>
      )}

      {showEmojiPicker && (
        <div className="emoji-picker-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 15px', backgroundColor: emojiTheme === 'dark' ? '#202c33' : '#f0f2f5', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: emojiTheme === 'dark' ? '#e9edef' : '#54656f', fontSize: '14px', fontWeight: '500' }}>Emoji Keyboard</span>
            <button 
              className="icon-btn" 
              onClick={() => {
                const newTheme = emojiTheme === 'dark' ? 'light' : 'dark';
                setEmojiTheme(newTheme);
                localStorage.setItem('whatsapp_emoji_theme', newTheme);
              }}
              title={`Switch to ${emojiTheme === 'dark' ? 'Light' : 'Dark'} Theme`}
              style={{ padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {emojiTheme === 'dark' ? <MdBrightness7 size={20} color="#e9edef" /> : <MdBrightness4 size={20} color="#54656f" />}
            </button>
          </div>
          <EmojiPicker onEmojiClick={onEmojiClick} theme={emojiTheme} width="100%" height={350} />
        </div>
      )}

      <div className="chat-input-container">
        {selectedUser.isBlocked ? (
           <div style={{ width: '100%', textAlign: 'center', padding: '15px', color: 'var(--text-color-secondary)' }}>
              You blocked this contact. <span style={{ color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onUserAction(selectedUser._id, 'block', false)}>Tap to unblock.</span>
           </div>
        ) : !isRecording ? (
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
