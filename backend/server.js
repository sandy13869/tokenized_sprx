const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 8080;

// Store active streams and viewers
const activeStreams = new Map();
const streamViewers = new Map();

// Contract ABIs (simplified - in production, import from compiled artifacts)
const contractAddresses = {
  token: process.env.TOKEN_CONTRACT_ADDRESS,
  accessPass: process.env.NFT_CONTRACT_ADDRESS,
  rightsManager: process.env.STREAMING_RIGHTS_CONTRACT_ADDRESS
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SPRX Streaming Server is running',
    activeStreams: activeStreams.size,
    totalViewers: Array.from(streamViewers.values()).reduce((a, b) => a + b, 0)
  });
});

// Get all active events
app.get('/api/events', async (req, res) => {
  try {
    const events = Array.from(activeStreams.entries()).map(([eventId, stream]) => ({
      eventId,
      name: stream.name,
      description: stream.description,
      startTime: stream.startTime,
      endTime: stream.endTime,
      viewers: streamViewers.get(eventId) || 0,
      isLive: stream.isLive
    }));
    
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific event details
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const stream = activeStreams.get(eventId);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.json({
      success: true,
      event: {
        eventId,
        ...stream,
        viewers: streamViewers.get(eventId) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new streaming event
app.post('/api/events', async (req, res) => {
  try {
    const { eventId, name, description, startTime, endTime, streamUrl } = req.body;
    
    if (!eventId || !name || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    activeStreams.set(eventId, {
      name,
      description,
      startTime,
      endTime,
      streamUrl,
      isLive: false,
      createdAt: Date.now()
    });
    
    streamViewers.set(eventId, 0);
    
    res.json({ 
      success: true, 
      message: 'Event created successfully',
      eventId 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start streaming for an event
app.post('/api/events/:eventId/start', async (req, res) => {
  try {
    const { eventId } = req.params;
    const stream = activeStreams.get(eventId);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    stream.isLive = true;
    activeStreams.set(eventId, stream);
    
    // Notify all connected clients
    io.emit('stream-started', { eventId, name: stream.name });
    
    res.json({ success: true, message: 'Stream started' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop streaming for an event
app.post('/api/events/:eventId/stop', async (req, res) => {
  try {
    const { eventId } = req.params;
    const stream = activeStreams.get(eventId);
    
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    stream.isLive = false;
    activeStreams.set(eventId, stream);
    
    // Notify all connected clients
    io.emit('stream-stopped', { eventId });
    
    res.json({ success: true, message: 'Stream stopped' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify user access to event
app.post('/api/verify-access', async (req, res) => {
  try {
    const { eventId, userAddress } = req.body;
    
    if (!eventId || !userAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing eventId or userAddress' 
      });
    }
    
    // In production, verify against blockchain
    // For now, return mock verification
    res.json({ 
      success: true, 
      hasAccess: true,
      accessLevel: 'standard'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join event stream
  socket.on('join-stream', async ({ eventId, userAddress }) => {
    try {
      console.log(`User ${userAddress} joining stream ${eventId}`);
      
      // Verify user has access (in production, check blockchain)
      const hasAccess = true; // Mock verification
      
      if (hasAccess) {
        socket.join(`stream-${eventId}`);
        
        // Increment viewer count
        const currentViewers = streamViewers.get(eventId) || 0;
        streamViewers.set(eventId, currentViewers + 1);
        
        // Notify user
        socket.emit('stream-joined', { 
          eventId, 
          success: true,
          viewers: streamViewers.get(eventId)
        });
        
        // Broadcast viewer count update
        io.to(`stream-${eventId}`).emit('viewer-count', {
          eventId,
          count: streamViewers.get(eventId)
        });
        
        console.log(`Stream ${eventId} now has ${streamViewers.get(eventId)} viewers`);
      } else {
        socket.emit('stream-error', { 
          error: 'Access denied - no valid pass found' 
        });
      }
    } catch (error) {
      socket.emit('stream-error', { error: error.message });
    }
  });
  
  // Leave event stream
  socket.on('leave-stream', ({ eventId }) => {
    socket.leave(`stream-${eventId}`);
    
    const currentViewers = streamViewers.get(eventId) || 0;
    if (currentViewers > 0) {
      streamViewers.set(eventId, currentViewers - 1);
      
      io.to(`stream-${eventId}`).emit('viewer-count', {
        eventId,
        count: streamViewers.get(eventId)
      });
    }
    
    console.log(`User left stream ${eventId}`);
  });
  
  // Handle AR/VR pose updates
  socket.on('pose-update', ({ eventId, pose }) => {
    // Broadcast pose to other viewers in the same stream
    socket.to(`stream-${eventId}`).emit('viewer-pose', {
      socketId: socket.id,
      pose
    });
  });
  
  // Handle chat messages
  socket.on('chat-message', ({ eventId, message, userAddress }) => {
    io.to(`stream-${eventId}`).emit('chat-message', {
      userAddress,
      message,
      timestamp: Date.now()
    });
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ SPRX Streaming Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 Contract Addresses:`);
  console.log(`   Token: ${contractAddresses.token || 'Not configured'}`);
  console.log(`   Access Pass: ${contractAddresses.accessPass || 'Not configured'}`);
  console.log(`   Rights Manager: ${contractAddresses.rightsManager || 'Not configured'}`);
});

module.exports = { app, server, io };
