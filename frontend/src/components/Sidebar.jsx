import React, { useState, useRef } from 'react';
import { MdLogout, MdSearch, MdPerson, MdMoreVert, MdArrowBack, MdPhotoCamera, MdDonutLarge, MdMessage, MdGroupAdd, MdGroup, MdLock, MdChat, MdNotifications, MdAccountCircle, MdHelpOutline, MdArchive, MdVolumeOff } from 'react-icons/md';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';

const Sidebar = ({ users, currentUser, selectedUser, onSelectUser, onLogout, onlineUsers, theme, onThemeChange, showSettings, setShowSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profilePic, setProfilePic] = useState(currentUser.profilePic || '');
  const [settingsView, setSettingsView] = useState('index');
  const [showArchived, setShowArchived] = useState(false);

  React.useEffect(() => {
     if (showSettings) setSettingsView('index');
  }, [showSettings]);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return format(d, 'h:mm a');
      if (isYesterday(d)) return 'Yesterday';
      return format(d, 'dd/MM/yyyy');
    } catch {
      return '';
    }
  };

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const fileInputRef = useRef(null);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeChats = filteredUsers.filter(u => !u.isArchived);
  const archivedChats = filteredUsers.filter(u => u.isArchived);

  const renderLastMessageSnippet = (msg) => {
    if (!msg) return '';
    switch (msg.type) {
      case 'text': return msg.text;
      case 'audio': return '🎤 Voice Message';
      case 'image': return '📷 Photo';
      case 'file': return `📎 ${msg.fileName || 'File'}`;
      case 'call': return '📞 Call';
      default: return msg.text || '📷 Photo';
    }
  };

  const renderUserItem = (user) => (
          <div 
            key={user._id} 
            className={`user-item ${selectedUser?._id === user._id ? 'active' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <div className="avatar">
              {user.isGroup ? <MdGroup size={24} color="#54656f" /> : user.profilePic ? <img src={user.profilePic} alt="" /> : <MdPerson size={24} color="#54656f" />}
            </div>
            <div className="user-details" style={{ width: '100%', overflow: 'hidden', paddingRight: 4 }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <h4 style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.username}</h4>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                   {user.isMuted && <MdVolumeOff size={16} color="#8696a0" />}
                   {user.lastMessage && (
                     <span style={{fontSize: '12px', color: user.unreadCount > 0 && !user.isMuted ? 'var(--accent-color)' : 'var(--text-color-secondary)'}}>
                        {formatMessageTime(user.lastMessage.createdAt || user.lastMessage.timestamp)}
                     </span>
                   )}
                 </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
                <span style={{ fontSize: '13px', color: 'var(--text-color-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                   {user.lastMessage ? renderLastMessageSnippet(user.lastMessage) : (onlineUsers?.includes(user._id) ? <span className="status-online-text">online</span> : '')}
                </span>
                {user.unreadCount > 0 && (
                   <div style={{ backgroundColor: user.isMuted ? '#8696a0' : 'var(--accent-color)', color: 'white', borderRadius: '50%', minWidth: 20, height: 20, padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {user.unreadCount}
                   </div>
                )}
              </div>
            </div>
          </div>
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setProfilePic(base64String);
        try {
          await axios.put(`http://localhost:5000/api/users/${currentUser._id}`, { profilePic: base64String });
          // Update local storage
          const updatedUser = { ...currentUser, profilePic: base64String };
          localStorage.setItem('whatsapp_clone_user', JSON.stringify(updatedUser));
          currentUser.profilePic = base64String;
        } catch (err) {
          console.error('Failed to upload profile pic', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleMember = (userId) => {
    setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/users/group', {
        name: groupName,
        admin: currentUser._id,
        members: [...selectedMembers, currentUser._id]
      });
      setShowGroupModal(false);
      window.location.reload(); // Refresh to catch new chat layout logic
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="sidebar">
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <button className="icon-btn" onClick={() => {
              if (settingsView === 'profile') setSettingsView('index');
              else setShowSettings(false);
            }}>
              <MdArrowBack size={24} color="#e9edef" />
            </button>
            <h2>{settingsView === 'profile' ? 'Profile' : 'Settings'}</h2>
          </div>
          <div className="settings-body" style={{ padding: settingsView === 'index' ? '0' : '20px' }}>
            {settingsView === 'index' ? (
               <div className="settings-index">
                  <div style={{ display: 'flex', alignItems: 'center', padding: '20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)'}} onClick={() => setSettingsView('profile')}>
                     {profilePic ? <img src={profilePic} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginRight: 20 }} /> : <MdPerson size={80} color="#54656f" style={{ marginRight: 20 }} />}
                     <div>
                       <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text-color-primary)' }}>{currentUser.username}</h3>
                       <p style={{ margin: '5px 0 0', color: 'var(--text-color-secondary)' }}>Available</p>
                     </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                     {[ 
                       { icon: MdLock, label: 'Privacy' },
                       { icon: MdChat, label: 'Chats' },
                       { icon: MdNotifications, label: 'Notifications' },
                       { icon: MdAccountCircle, label: 'Account' },
                       { icon: MdHelpOutline, label: 'Help' },
                     ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', padding: '15px 25px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' } }, 
                        React.createElement(item.icon, { size: 24, color: '#8696a0', style: { marginRight: 25 } }),
                        React.createElement('span', { style: { fontSize: 17, color: 'var(--text-color-primary)' } }, item.label)
                     ))}
                  </div>
               </div>
            ) : (
               <>
                 <div className="profile-edit-avatar">
                   <div className="avatar-large" onClick={() => fileInputRef.current?.click()}>
                     {profilePic ? (
                       <img src={profilePic} alt="Profile" />
                     ) : (
                       <MdPerson size={80} color="#54656f" />
                     )}
                     <div className="avatar-overlay">
                       <MdPhotoCamera size={24} color="#fff" />
                       <span>CHANGE</span>
                       <span>PROFILE PHOTO</span>
                     </div>
                   </div>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     style={{ display: 'none' }} 
                     accept="image/*" 
                     onChange={handleFileChange} 
                   />
                 </div>
                 <div className="profile-info-section">
                   <span className="info-label">Your name</span>
                   <div className="info-value">
                     {currentUser.username}
                   </div>
                 </div>
                 <div className="profile-info-section" style={{marginTop: 20}}>
                   <span className="info-label">Theme Settings</span>
                   <div className="info-value" style={{display: 'flex', gap: '15px', marginTop: '10px', paddingBottom: '10px'}}>
                     <button 
                       onClick={() => onThemeChange('light-theme')}
                       style={{
                         padding: '10px 16px', borderRadius: 20, border: '1px solid var(--border-color)', 
                         background: theme === 'light-theme' ? 'var(--accent-color)' : 'transparent', 
                         color: theme === 'light-theme' ? '#fff' : 'var(--text-color-primary)', 
                         cursor: 'pointer', flex: 1, fontWeight: '500'
                       }}
                     >Light Mode</button>
                     <button 
                       onClick={() => onThemeChange('dark-theme')}
                       style={{
                         padding: '10px 16px', borderRadius: 20, border: '1px solid var(--border-color)', 
                         background: theme === 'dark-theme' ? 'var(--accent-color)' : 'transparent', 
                         color: theme === 'dark-theme' ? '#fff' : 'var(--text-color-primary)', 
                         cursor: 'pointer', flex: 1, fontWeight: '500'
                       }}
                     >Dark Mode</button>
                   </div>
                 </div>
               </>
            )}
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="settings-panel">
          <div className="settings-header">
          <button className="icon-btn" onClick={() => setShowGroupModal(false)}>
            <MdArrowBack size={24} color="#e9edef" />
          </button>
          <h2>New Group</h2>
        </div>
        <div className="settings-body" style={{padding: '20px'}}>
          <input 
            type="text" 
            placeholder="Type Group Subject..." 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--bg-color-main)', color: 'var(--text-color-primary)', outline: 'none'}}
          />
          <h4 style={{marginBottom: 10, color: 'var(--accent-color)'}}>Select Group Members</h4>
          <div style={{maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '5px'}}>
            {users.map(u => {
              if(u.isGroup || u._id === currentUser._id) return null;
              return (
                <div key={u._id} onClick={() => handleToggleMember(u._id)} style={{display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer', backgroundColor: selectedMembers.includes(u._id) ? 'rgba(0, 168, 132, 0.1)' : 'transparent', borderBottom: '1px solid var(--border-color)'}}>
                  <input type="checkbox" checked={selectedMembers.includes(u._id)} readOnly style={{marginRight: 15, accentColor: 'var(--accent-color)', width: '16px', height: '16px'}} />
                  <span style={{fontSize: '15px'}}>{u.username}</span>
                </div>
              )
            })}
          </div>
          <button 
             onClick={handleCreateGroup}
             style={{width: '100%', padding: '12px', marginTop: '20px', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
             ✓ Create Group
          </button>
        </div>
        </div>
      )}

      <div className="sidebar-header" style={{height: 'auto', padding: '20px 16px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{fontSize: 22, fontWeight: 700, color: 'var(--text-color-primary)', margin: 0}}>Chats</h2>
        <div className="sidebar-header-actions" style={{display: 'flex', gap: '10px'}}>
          <button className="icon-btn" title="New group" onClick={() => setShowGroupModal(true)}>
            <MdGroupAdd size={20} />
          </button>
          <button className="icon-btn" title="New chat">
            <MdMessage size={20} />
          </button>
          <button className="icon-btn logout-btn" onClick={onLogout} title="Logout">
            <MdLogout size={20} />
          </button>
        </div>
      </div>
      
      <div className="search-container">
        <div className="search-bar">
          <MdSearch size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search or start new chat" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-list">
        {showArchived ? (
          <>
            <div onClick={() => setShowArchived(false)} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', color: 'var(--text-color-primary)' }}>
               <MdArrowBack size={20} style={{ marginRight: 15 }} />
               <h4 style={{ margin: 0, fontSize: 16 }}>Archived Chats</h4>
            </div>
            {archivedChats.map(renderUserItem)}
          </>
        ) : (
          <>
            {archivedChats.length > 0 && !searchTerm && (
              <div onClick={() => setShowArchived(true)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-color-primary)' }}>
                   <MdArchive size={20} style={{ marginRight: 15, color: '#8696a0' }} />
                   <h4 style={{ margin: 0, fontWeight: 500, fontSize: 16 }}>Archived</h4>
                 </div>
                 <span style={{ color: 'var(--accent-color)', fontSize: 12, fontWeight: 'bold' }}>{archivedChats.length}</span>
              </div>
            )}
            {activeChats.map(renderUserItem)}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
