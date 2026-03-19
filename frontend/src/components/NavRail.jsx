import React from 'react';
import { MdMessage, MdCall, MdDonutLarge, MdPeople, MdStarBorder, MdArchive, MdSettings, MdPerson } from 'react-icons/md';

const NavRail = ({ currentUser, activeTab, onTabChange, onOpenSettings }) => {
  return (
    <div className="nav-rail">
      <div className="nav-rail-top">
        <button 
          className={`rail-icon-btn ${activeTab === 'chats' ? 'active' : ''}`} 
          onClick={() => onTabChange('chats')}
          title="Chats"
        >
          <div className="rail-icon-wrapper">
             <MdMessage size={24} />
             {/* Fake replica unread badge */}
             <span className="rail-badge">99+</span>
          </div>
        </button>
        <button 
          className={`rail-icon-btn ${activeTab === 'calls' ? 'active' : ''}`} 
          onClick={() => onTabChange('calls')}
          title="Calls"
        >
          <MdCall size={24} />
        </button>
        <button 
          className={`rail-icon-btn ${activeTab === 'status' ? 'active' : ''}`} 
          onClick={() => onTabChange('status')}
          title="Status"
        >
          <div className="rail-icon-wrapper">
            <MdDonutLarge size={24} />
            <span className="rail-dot-indicator"></span>
          </div>
        </button>
        <button 
          className={`rail-icon-btn ${activeTab === 'communities' ? 'active' : ''}`} 
          onClick={() => onTabChange('communities')}
          title="Communities"
        >
          <MdPeople size={24} />
        </button>
        <button 
          className="rail-icon-btn meta-ai-icon" 
          title="Meta AI"
        >
          <div className="meta-ai-circle"></div>
        </button>
      </div>

      <div className="nav-rail-bottom">
        <button className="rail-icon-btn" title="Starred messages">
          <MdStarBorder size={24} />
        </button>
        <button className="rail-icon-btn" title="Archived">
          <MdArchive size={24} />
        </button>
        <button className="rail-icon-btn" title="Settings" onClick={onOpenSettings}>
          <MdSettings size={24} />
        </button>
        <button className="rail-avatar-btn" title="Profile" onClick={onOpenSettings}>
          {currentUser?.profilePic ? (
            <img src={currentUser.profilePic} alt="Profile" className="nav-rail-avatar" />
          ) : (
            <MdPerson size={30} color="#54656f" />
          )}
        </button>
      </div>
    </div>
  );
};

export default NavRail;
