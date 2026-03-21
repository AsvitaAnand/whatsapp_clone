import React from 'react';
import { MdPeople, MdArrowForwardIos } from 'react-icons/md';

const CommunitiesSidebar = () => {
  const dummyCommunities = [
    { id: 1, name: "Neighborhood Watch", members: 120, image: "https://via.placeholder.com/150/25D366/FFFFFF?text=NW" },
    { id: 2, name: "Local Developers", members: 840, image: "https://via.placeholder.com/150/128C7E/FFFFFF?text=Dev" },
    { id: 3, name: "Gaming Squad", members: 45, image: "https://via.placeholder.com/150/34B7F1/FFFFFF?text=GS" }
  ];

  return (
    <div className="sidebar" style={{ backgroundColor: 'var(--bg-color-main)', display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-header" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
        <h2 style={{color: 'var(--text-color-primary)', margin: 0, fontSize: 22}}>Communities</h2>
      </div>
      <div style={{ padding: '20px 15px', borderBottom: '8px solid var(--bg-color-panel)', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
         <div style={{ backgroundColor: 'var(--accent-color)', borderRadius: '10px', padding: 12, marginRight: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <MdPeople size={28} color="#fff" />
         </div>
         <span style={{ color: 'var(--text-color-primary)', fontSize: 17, fontWeight: 500 }}>New Community</span>
      </div>
      
      <div className="communities-list" style={{ overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-color-main)' }}>
        {dummyCommunities.map(community => (
          <div key={community.id} style={{ padding: '15px', borderBottom: '8px solid var(--bg-color-panel)', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
             <img src={community.image} alt={community.name} style={{ width: 50, height: 50, borderRadius: '10px', objectFit: 'cover', marginRight: 15 }} />
             <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: 'var(--text-color-primary)', fontSize: 16 }}>{community.name}</h4>
             </div>
             <MdArrowForwardIos size={14} color="var(--text-color-secondary)" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunitiesSidebar;
