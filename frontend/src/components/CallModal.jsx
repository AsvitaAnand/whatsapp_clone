import React, { useEffect, useRef, useState } from 'react';
import { MdCallEnd, MdCall, MdVideocam, MdVideocamOff, MdMic, MdMicOff } from 'react-icons/md';
import axios from 'axios';

const CallModal = ({ socket, currentUser, callState, setCallState, users }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(true);

  // Determine who we are calling or receiving from
  const TARGET_USER_ID = callState.status === 'receiving' ? callState.from : callState.target;
  const targetUserObj = users.find(u => u._id === TARGET_USER_ID);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: callState.isVideo, 
          audio: true 
        });
        localStream.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setHasVideo(callState.isVideo);

        setupPeerConnection(stream);

        if (callState.status === 'calling') {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit('webrtc_offer', { 
            target: callState.target, 
            caller: currentUser._id, 
            sdp: peerConnection.current.localDescription,
            isVideo: callState.isVideo
          });
        }
      } catch (err) {
        console.error("Failed to acquire media devices: ", err);
        endCall(true);
      }
    };

    if (callState.status === 'calling' || callState.status === 'connected') {
      if (!localStream.current) initCall();
    }

    let ringTimeout;
    if (callState.status === 'calling' || callState.status === 'receiving') {
      ringTimeout = setTimeout(() => {
        endCall(callState.status === 'calling'); // Caller emits end call
      }, 30000);
    }

    return () => {
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, [callState.status]);

  function setupPeerConnection(stream) {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    stream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          target: TARGET_USER_ID,
          candidate: event.candidate
        });
      }
    };
  };

  // Listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleOffer = (data) => {
      // If we are already in a call, ignore incoming
      if (callState && callState.status !== 'idle') return;
      
      setCallState({
        status: 'receiving',
        from: data.caller,
        isVideo: data.isVideo,
        sdp: data.sdp
      });
    };

    const handleAnswer = async (data) => {
      if (peerConnection.current && callState.status === 'calling') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        setCallState(prev => ({ ...prev, status: 'connected' }));
      }
    };

    const handleIceCandidate = async (data) => {
      if (peerConnection.current && data.candidate && callState.status !== 'idle') {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e=>console.error(e));
      }
    };

    const handleCallEnded = () => {
      endCall(false); // false means don't emit end_call again
    };

    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
    };
  }, [callState, socket]);

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: callState.isVideo, 
        audio: true 
      });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setHasVideo(callState.isVideo);

      setupPeerConnection(stream);
      
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callState.sdp));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit('webrtc_answer', {
        target: callState.from,
        sdp: peerConnection.current.localDescription
      });

      setCallState(prev => ({ ...prev, status: 'connected' }));
    } catch (err) {
      console.error(err);
      endCall(true);
    }
  };

  function endCall(emit = true) {
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (emit && TARGET_USER_ID) {
      socket.emit('call_ended', { target: TARGET_USER_ID });
      try {
        axios.post('http://localhost:5000/api/messages', {
          senderId: currentUser._id,
          receiverId: TARGET_USER_ID,
          type: 'call',
          text: callState.status === 'connected' ? 'Completed Call' : 'Missed Call'
        });
      } catch (err) { console.error('Failed to log call', err); }
    }
    setCallState({ status: 'idle' });
  };

  const toggleVideo = () => {
    const videoTrack = localStream.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setHasVideo(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    const audioTrack = localStream.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setHasAudio(audioTrack.enabled);
    }
  };

  if(!callState || callState.status === 'idle') return null;

  return (
    <div className="call-modal-overlay">
      <div className="call-window">
        {callState.status === 'receiving' ? (
          <div className="incoming-call-ui">
            <h2>Incoming {callState.isVideo ? 'Video' : 'Voice'} Call...</h2>
            <h3>{targetUserObj?.username || 'Unknown'}</h3>
            <div className="call-actions">
              <button className="accept-btn" onClick={acceptCall}><MdCall size={32} /></button>
              <button className="reject-btn" onClick={() => endCall(true)}><MdCallEnd size={32} /></button>
            </div>
          </div>
        ) : (
          <div className="active-call-ui">
            <div className="video-grid">
              <video ref={localVideoRef} className="local-video" autoPlay muted playsInline style={{ display: hasVideo ? 'block' : 'none' }} />
              <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
              {callState.status === 'calling' && <div className="calling-layer">Calling {targetUserObj?.username}...</div>}
            </div>
            <div className="call-controls">
              {callState.isVideo && (
                <button className="icon-btn control-btn" onClick={toggleVideo}>
                  {hasVideo ? <MdVideocam size={28} /> : <MdVideocamOff size={28} color="#ef5350"/>}
                </button>
              )}
              <button className="icon-btn control-btn" onClick={toggleAudio}>
                {hasAudio ? <MdMic size={28} /> : <MdMicOff size={28} color="#ef5350" />}
              </button>
              <button className="reject-btn end-btn" onClick={() => endCall(true)}>
                <MdCallEnd size={32} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CallModal;
