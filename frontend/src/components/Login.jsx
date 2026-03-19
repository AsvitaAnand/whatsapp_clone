import React, { useState } from 'react';
import axios from 'axios';
import { MdMonitor, MdMoreVert, MdSettings } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

const sampleUsers = [
  { username: 'Alice', email: 'alice@test.com' },
  { username: 'Bob', email: 'bob@test.com' },
  { username: 'Charlie', email: 'charlie@test.com' },
  { username: 'Dave', email: 'dave@test.com' }
];

const Login = ({ onLogin }) => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginProcess = async (username) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Create user simply by taking the email prefix to match our simplistic backend model
      const username = email.split('@')[0];
      loginProcess(username);
    }
  };

  const handleSampleLogin = (username) => {
    loginProcess(username);
  };

  return (
    <div className="whatsapp-login-page">
      <div className="login-header-band">
        <div className="login-header-logo">
          <FaWhatsapp size={32} />
          <span>WhatsApp Web Clone</span>
        </div>
      </div>
      
      <div className="login-content-wrapper">
        <div className="download-banner">
          <div className="download-banner-left">
            <div className="download-icon">
              <MdMonitor size={30} color="#00a884" />
            </div>
            <div className="download-text">
              <h3>Download WhatsApp for Windows</h3>
              <p>Get extra features like voice and video calling, screen sharing and more.</p>
            </div>
          </div>
          <button className="download-btn">Download</button>
        </div>

        <div className="qr-card">
          <div className="qr-card-left">
            <h2>Use WhatsApp on your computer</h2>
            <ol className="instructions-list">
              <li>Open WhatsApp on your phone</li>
              <li>Tap <strong>Menu</strong> <MdMoreVert className="inline-icon" /> on Android, or <strong>Settings</strong> <MdSettings className="inline-icon" /> on iPhone</li>
              <li>Tap <strong>Linked devices</strong> and then <strong>Link a device</strong></li>
              <li>Point your phone to this screen to capture the QR code</li>
            </ol>
            <a href="#" className="need-help-link">Need help to get started?</a>
          </div>
          <div className="qr-card-right">
            {/* Clickable QR Code to trigger manual login */}
            <div className="qr-container" onClick={() => setShowModal(true)} title="Click here to login as sample users">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png" alt="QR Code" className="qr-image" />
              <div className="qr-logo-overlay">
                <FaWhatsapp color="#00a884" size={30}/>
              </div>
            </div>
            <div className="stay-logged-in">
              <input type="checkbox" id="keep-signed" defaultChecked />
              <label htmlFor="keep-signed">Keep me signed in</label>
            </div>
            <p className="qr-hint-text" style={{marginTop: '15px', color: '#00a884', fontSize: '13px', fontWeight: '500'}}>CLICK THE QR CODE TO LOGIN!</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <h3>Developer Login Portal</h3>
            <p>Select a sample account below or sign in manually.</p>
            
            <div className="sample-users-grid">
              {sampleUsers.map(u => (
                <button key={u.username} type="button" onClick={() => handleSampleLogin(u.username)}>
                  Login as {u.username}
                </button>
              ))}
            </div>

            <div className="divider"><span>OR ENTER DETAILS</span></div>

            <form onSubmit={handleSubmit} className="manual-login-form">
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="submit">Sign In</button>
            </form>
            {error && <p className="error-text">{error}</p>}
            
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
