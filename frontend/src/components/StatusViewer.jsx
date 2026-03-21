import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdClose, MdSend, MdPalette, MdDonutLarge, MdPhotoCamera, MdTextFields } from 'react-icons/md';

const API_URL = 'http://localhost:5000/api';

const StatusViewer = ({ selectedStatusUser, currentUser, onClose, onStatusAdded }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // For adding text status
  const [textMode, setTextMode] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [bgColors] = useState(['#00a884', '#53bdeb', '#ff8a8c', '#54656f', '#8e3596']);
  const [colorIdx, setColorIdx] = useState(0);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setTextMode(false); // Make sure it switches to image mode
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (selectedStatusUser === 'add') {
      setTextMode(true);
      setPreviewUrl('');
      setSelectedFile(null);
      return;
    }
    
    // Auto advance statuses
    if (selectedStatusUser && selectedStatusUser.items && selectedStatusUser.items.length > 0) {
      if (progress < 100) {
        const timer = setTimeout(() => setProgress(prev => prev + 2), 100); // 5 sec per item
        return () => clearTimeout(timer);
      } else {
        if (activeIndex < selectedStatusUser.items.length - 1) {
          setActiveIndex(prev => prev + 1);
          setProgress(0);
        } else {
          onClose(); // Finished viewing
        }
      }
    }
  }, [progress, selectedStatusUser, activeIndex, onClose]);

  useEffect(() => {
    // Reset when user changes
    setActiveIndex(0);
    setProgress(0);
    if (selectedStatusUser !== 'add') setTextMode(false);
  }, [selectedStatusUser]);

  const handleAddStatus = async () => {
     if (!textMode && !previewUrl) return;
     if (textMode && !statusText.trim()) return;

     try {
       await axios.post(`${API_URL}/status`, {
         userId: currentUser._id,
         type: textMode ? 'text' : 'image',
         content: textMode ? statusText : previewUrl,
         backgroundColor: textMode ? bgColors[colorIdx] : '#000'
       });
       setStatusText('');
       setPreviewUrl('');
       setSelectedFile(null);
       onClose(); // Close after add
       if (onStatusAdded) onStatusAdded();
     } catch (err) {
       console.error(err);
     }
  };

  if (!selectedStatusUser) {
    return (
      <div className="chat-empty" style={{ backgroundColor: '#0b141a' }}>
        <div className="chat-empty-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <MdDonutLarge size={64} color="#54656f" style={{ marginBottom: 20 }} />
           <p style={{ color: 'var(--text-color-secondary)' }}>Click on a contact to view their status updates</p>
        </div>
      </div>
    );
  }

  // Render ADD STATUS view
  if (selectedStatusUser === 'add' || (textMode || previewUrl)) {
     return (
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: textMode ? bgColors[colorIdx] : '#000', position: 'relative', height: '100%', transition: 'background-color 0.3s' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', zIndex: 10, padding: 10 }} onClick={onClose}>
             <MdClose size={30} color="white" />
          </div>
          
          {textMode && (
             <div style={{ position: 'absolute', top: 20, right: 80, cursor: 'pointer', zIndex: 10, padding: 10 }} onClick={() => setColorIdx((colorIdx + 1) % bgColors.length)} title="Change Color">
                <MdPalette size={28} color="white" />
             </div>
          )}

          {/* Mode Switchers */}
          <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: 30 }}>
             <button onClick={() => { setTextMode(true); setPreviewUrl(''); setSelectedFile(null); }} style={{ background: 'none', border: 'none', color: textMode ? 'var(--accent-color)' : 'white', cursor: 'pointer' }}><MdTextFields size={28} /></button>
             <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: !textMode && previewUrl ? 'var(--accent-color)' : 'white', cursor: 'pointer' }}><MdPhotoCamera size={28} /></button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
             {textMode ? (
               <textarea 
                 value={statusText}
                 onChange={e => setStatusText(e.target.value)}
                 placeholder="Type a status"
                 style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 36, textAlign: 'center', outline: 'none', width: '100%', resize: 'none', minHeight: 150 }}
                 autoFocus
               />
             ) : (
               previewUrl && <img src={previewUrl} alt="Preview" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
             )}
          </div>
          
          {(statusText.trim() || previewUrl) && (
             <button onClick={handleAddStatus} style={{ position: 'absolute', bottom: 40, right: 40, background: '#00a884', border: 'none', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                <MdSend size={28} color="white" />
             </button>
          )}
       </div>
     );
  }

  // Render Viewing Statuses
  const currentItem = selectedStatusUser.items[activeIndex];

  return (
    <div style={{ flex: 1, backgroundColor: currentItem.backgroundColor || '#0b141a', display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>
      {/* Progress Bars */}
      <div style={{ display: 'flex', gap: 5, padding: '20px 20px 10px', width: '100%', zIndex: 10, position: 'absolute', top: 0, left: 0 }}>
         {selectedStatusUser.items.map((_, idx) => (
            <div key={idx} style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
               <div style={{ height: '100%', backgroundColor: 'white', width: idx < activeIndex ? '100%' : idx === activeIndex ? `${progress}%` : '0%', transition: idx === activeIndex ? 'width 0.1s linear' : 'none' }}></div>
            </div>
         ))}
      </div>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', position: 'absolute', top: 30, left: 0, width: '100%', zIndex: 10, justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedStatusUser.user.profilePic ? (
               <img src={selectedStatusUser.user.profilePic} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
               <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#dfe5e7' }}></div>
            )}
            <span style={{ color: 'white', fontSize: 16, fontWeight: '500', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{selectedStatusUser.user.username}</span>
         </div>
         <div style={{ cursor: 'pointer', padding: 10 }} onClick={onClose}>
            <MdClose size={30} color="white" />
         </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
         {currentItem.type === 'text' ? (
            <h1 style={{ color: 'white', fontSize: 36, textAlign: 'center', maxWidth: 800 }}>{currentItem.content}</h1>
         ) : (
            <img src={currentItem.content} alt="" style={{ maxHeight: '80%', maxWidth: '80%', objectFit: 'contain' }} />
         )}
      </div>
    </div>
  );
};

export default StatusViewer;
