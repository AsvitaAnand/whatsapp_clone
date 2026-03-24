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
        {(() => {
          const myStatusGroup = statuses.find(s => String(s.user._id) === String(currentUser._id));
          return (
            <div className="user-item" onClick={() => onSelectStatusUser(myStatusGroup || 'add')}>
              <div className="avatar" style={{ position: 'relative' }}>
                <div className={myStatusGroup ? "status-ring" : ""} style={{ width: '100%', height: '100%', borderRadius: '50%', padding: myStatusGroup ? 2 : 0, background: myStatusGroup ? 'conic-gradient(from 0deg, var(--accent-color) 0%, var(--accent-color) 100%)' : 'transparent' }}>
                   {currentUser.profilePic ? (
                       <img src={currentUser.profilePic} alt="Me" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: myStatusGroup ? '2px solid var(--bg-color-main)' : 'none'}} />
                   ) : (
                       <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', borderRadius: '50%', border: myStatusGroup ? '2px solid var(--bg-color-main)' : 'none' }}></div>
                   )}
                </div>
                {!myStatusGroup && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--accent-color)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-color-main)' }}>
                    <MdAdd size={12} color="white" />
                  </div>
                )}
              </div>
              <div className="user-details" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                <div>
                  <h4>My status</h4>
                  <span style={{ fontSize: '13px', color: 'var(--text-color-secondary)' }}>
                    {myStatusGroup ? 'Tap to view your status update' : 'Click to add status update'}
                  </span>
                </div>
                {myStatusGroup && (
                  <button className="icon-btn" style={{padding: 5}} onClick={(e) => { e.stopPropagation(); onSelectStatusUser('add'); }}>
                     <MdAdd size={20} color="var(--text-color-secondary)" />
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        <div style={{ padding: '15px 16px 5px', color: 'var(--accent-color)', fontSize: '14px', fontWeight: '500' }}>
          Recent updates
        </div>

        {statuses.filter(s => String(s.user._id) !== String(currentUser._id)).map((statusGroup, idx) => (
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
