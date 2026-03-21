import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdAdd } from 'react-icons/md';

const API_URL = 'http://localhost:5000/api';

const StatusSidebar = ({ currentUser, onSelectStatusUser, refreshTrigger }) => {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await axios.get(`${API_URL}/status`);
        setStatuses(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatuses();
  }, [refreshTrigger]);

  return (
    <div className="sidebar" style={{ backgroundColor: 'var(--bg-color-main)' }}>
      <div className="sidebar-header" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
        <h2 style={{color: 'var(--text-color-primary)', margin: 0, fontSize: '22px'}}>Status</h2>
      </div>
      
      <div className="status-list" style={{ overflowY: 'auto', flex: 1 }}>
        {/* My Status */}
        <div className="user-item" onClick={() => onSelectStatusUser('add')}>
          <div className="avatar" style={{ position: 'relative' }}>
            {currentUser.profilePic ? (
                <img src={currentUser.profilePic} alt="Me" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', borderRadius: '50%' }}></div>
            )}
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--accent-color)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-color-main)' }}>
              <MdAdd size={12} color="white" />
            </div>
          </div>
          <div className="user-details">
            <h4>My status</h4>
            <span style={{ fontSize: '13px', color: 'var(--text-color-secondary)' }}>Click to add status update</span>
          </div>
        </div>

        <div style={{ padding: '15px 16px 5px', color: 'var(--accent-color)', fontSize: '14px', fontWeight: '500' }}>
          Recent updates
        </div>

        {statuses.filter(s => s.user._id !== currentUser._id).map((statusGroup, idx) => (
          <div key={idx} className="user-item" onClick={() => onSelectStatusUser(statusGroup)}>
            <div className="avatar status-ring">
               {statusGroup.user.profilePic ? (
                  <img src={statusGroup.user.profilePic} alt={statusGroup.user.username} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
               ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', borderRadius: '50%' }}></div>
               )}
            </div>
            <div className="user-details">
              <h4>{statusGroup.user.username}</h4>
              <span style={{ fontSize: '13px', color: 'var(--text-color-secondary)' }}>
                {statusGroup.items.length} updates
              </span>
            </div>
          </div>
        ))}
        {statuses.filter(s => s.user._id !== currentUser._id).length === 0 && (
           <div style={{ padding: '15px 16px', color: 'var(--text-color-secondary)', fontSize: '14px' }}>
              No recent updates.
           </div>
        )}
      </div>
    </div>
  );
};

export default StatusSidebar;
