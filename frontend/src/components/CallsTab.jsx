import React, { useState, useEffect } from 'react';
import { MdCall, MdVideocam, MdCallMissed, MdCallMade, MdCallReceived } from 'react-icons/md';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../config';

const CallsTab = ({ currentUser, users, onStartCall }) => {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const url = `${API_URL}/messages/calls/${currentUser._id}`;
        const res = await axios.get(url);
        setCalls(res.data);
      } catch (err) {
        console.error('Failed to fetch call history', err);
      }
    };
    fetchCalls();
  }, [currentUser._id]);

  return (
    <div className="sidebar" style={{ backgroundColor: 'var(--bg-color-main)' }}>
      <div className="sidebar-header" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--text-color-primary)', margin: 0 }}>Calls</h2>
      </div>
      
      <div className="users-list" style={{ flex: 1, overflowY: 'auto' }}>
        {calls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-color-secondary)' }}>
            No recent calls
          </div>
        ) : (
          calls.map(call => {
            const isCaller = call.senderId === currentUser._id;
            const otherPartyId = isCaller ? call.receiverId : call.senderId;
            const otherUser = users.find(u => u._id === otherPartyId);
            
            const isMissed = call.status === 'missed';
            const iconColor = isMissed ? 'var(--danger-color)' : 'var(--accent-color)';
            
            return (
              <div key={call._id} className="user-item" style={{ cursor: 'default' }}>
                <div className="avatar">
                  {otherUser?.profilePic ? (
                    <img src={otherUser.profilePic} alt="" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#54656f', fontSize: 20 }}>👤</span>
                    </div>
                  )}
                </div>
                <div className="user-details" style={{ flex: 1 }}>
                  <h4 style={{ color: isMissed ? iconColor : 'var(--text-color-primary)', fontSize: 16 }}>
                    {otherUser ? otherUser.username : 'Unknown'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-color-secondary)', fontSize: 13, marginTop: 4 }}>
                    {isCaller ? <MdCallMade size={14} color={iconColor} /> : <MdCallReceived size={14} color={iconColor} />}
                    <span>{format(new Date(call.createdAt), 'MM/dd/yy, hh:mm a')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 15, paddingRight: 10 }}>
                  <button onClick={() => onStartCall(otherUser?._id, false)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }}>
                    <MdCall size={24} />
                  </button>
                  <button onClick={() => onStartCall(otherUser?._id, true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }}>
                    <MdVideocam size={24} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CallsTab;
