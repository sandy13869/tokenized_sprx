import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ARVRViewer from './ARVRViewer';

const StreamViewer = ({ account, isConnected }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isVRMode, setIsVRMode] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Mock event data
    setEvent({
      eventId,
      name: 'NBA Finals 2024 - Game 7',
      description: 'Championship game with AR/VR features',
      isLive: true
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (socket && account) {
      // Join stream
      socket.emit('join-stream', { eventId, userAddress: account });

      // Listen for viewer count updates
      socket.on('viewer-count', ({ count }) => {
        setViewerCount(count);
      });

      // Listen for chat messages
      socket.on('chat-message', ({ userAddress, message, timestamp }) => {
        setChatMessages(prev => [...prev, { userAddress, message, timestamp }]);
      });

      return () => {
        socket.emit('leave-stream', { eventId });
        socket.off('viewer-count');
        socket.off('chat-message');
      };
    }
  }, [socket, account, eventId]);

  const sendChatMessage = () => {
    if (socket && message.trim() && account) {
      socket.emit('chat-message', {
        eventId,
        message: message.trim(),
        userAddress: account
      });
      setMessage('');
    }
  };

  const toggleVRMode = () => {
    setIsVRMode(!isVRMode);
  };

  if (!isConnected) {
    return (
      <div className="stream-viewer-error">
        <h2>⚠️ Wallet Not Connected</h2>
        <p>Please connect your wallet to view this stream</p>
        <button onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

  if (!event) {
    return <div className="loading">Loading stream...</div>;
  }

  return (
    <div className="stream-viewer">
      <div className="stream-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back
        </button>
        <h2>{event.name}</h2>
        <div className="stream-stats">
          <span className="live-indicator">🔴 LIVE</span>
          <span className="viewer-count">👥 {viewerCount} viewers</span>
        </div>
      </div>

      <div className="stream-content">
        <div className="video-container">
          {isVRMode ? (
            <ARVRViewer eventId={eventId} />
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <h3>🎮 AR/VR Stream Viewer</h3>
                <p>Stream content would appear here</p>
                <button onClick={toggleVRMode} className="vr-toggle-btn">
                  🥽 Enable VR Mode
                </button>
              </div>
            </div>
          )}
          
          <div className="video-controls">
            <button className="control-btn">⏸️ Pause</button>
            <button className="control-btn" onClick={toggleVRMode}>
              {isVRMode ? '📺 Exit VR' : '🥽 VR Mode'}
            </button>
            <button className="control-btn">🔊 Volume</button>
            <button className="control-btn">⚙️ Quality</button>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-header">
            <h3>💬 Live Chat</h3>
          </div>
          
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <p className="no-messages">No messages yet. Be the first to chat!</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="chat-message">
                  <span className="message-author">
                    {msg.userAddress.substring(0, 6)}...
                  </span>
                  <span className="message-text">{msg.message}</span>
                </div>
              ))
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendChatMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;
