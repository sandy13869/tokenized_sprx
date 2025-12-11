# API Documentation

## Backend API Reference

Base URL: `http://localhost:3000`

---

## REST Endpoints

### Health Check

**GET** `/health`

Returns the server health status and statistics.

**Response:**
```json
{
  "status": "ok",
  "message": "SPRX Streaming Server is running",
  "activeStreams": 3,
  "totalViewers": 152
}
```

---

### Events

#### List All Events

**GET** `/api/events`

Get all active streaming events.

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "eventId": "1",
      "name": "NBA Finals Game 7",
      "description": "Championship game with AR/VR viewing",
      "startTime": 1702345678000,
      "endTime": 1702352878000,
      "viewers": 1247,
      "isLive": true
    }
  ]
}
```

#### Get Event Details

**GET** `/api/events/:eventId`

Get details for a specific event.

**Parameters:**
- `eventId` (path) - Event identifier

**Response:**
```json
{
  "success": true,
  "event": {
    "eventId": "1",
    "name": "NBA Finals Game 7",
    "description": "Championship game with AR/VR viewing",
    "startTime": 1702345678000,
    "endTime": 1702352878000,
    "streamUrl": "stream://...",
    "isLive": true,
    "viewers": 1247,
    "createdAt": 1702340000000
  }
}
```

#### Create Event

**POST** `/api/events`

Create a new streaming event.

**Request Body:**
```json
{
  "eventId": "1",
  "name": "NBA Finals Game 7",
  "description": "Championship game with AR/VR viewing",
  "startTime": 1702345678000,
  "endTime": 1702352878000,
  "streamUrl": "stream://example.com/stream1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "eventId": "1"
}
```

#### Start Stream

**POST** `/api/events/:eventId/start`

Start streaming for an event.

**Parameters:**
- `eventId` (path) - Event identifier

**Response:**
```json
{
  "success": true,
  "message": "Stream started"
}
```

#### Stop Stream

**POST** `/api/events/:eventId/stop`

Stop streaming for an event.

**Parameters:**
- `eventId` (path) - Event identifier

**Response:**
```json
{
  "success": true,
  "message": "Stream stopped"
}
```

---

### Access Verification

**POST** `/api/verify-access`

Verify if a user has access to an event.

**Request Body:**
```json
{
  "eventId": "1",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
}
```

**Response:**
```json
{
  "success": true,
  "hasAccess": true,
  "accessLevel": "premium"
}
```

---

## WebSocket Events

Connect to: `ws://localhost:3000`

### Client Events (Client → Server)

#### Join Stream

Join an event stream to start viewing.

**Event:** `join-stream`

**Payload:**
```json
{
  "eventId": "1",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
}
```

#### Leave Stream

Leave an event stream.

**Event:** `leave-stream`

**Payload:**
```json
{
  "eventId": "1"
}
```

#### Pose Update

Send AR/VR viewer pose updates.

**Event:** `pose-update`

**Payload:**
```json
{
  "eventId": "1",
  "pose": {
    "position": { "x": 0, "y": 1.6, "z": 5 },
    "rotation": { "x": 0, "y": 0, "z": 0 }
  }
}
```

#### Chat Message

Send a chat message to the stream.

**Event:** `chat-message`

**Payload:**
```json
{
  "eventId": "1",
  "message": "Great game!",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
}
```

---

### Server Events (Server → Client)

#### Stream Joined

Confirmation that user joined the stream.

**Event:** `stream-joined`

**Payload:**
```json
{
  "eventId": "1",
  "success": true,
  "viewers": 1248
}
```

#### Viewer Count Update

Real-time viewer count updates.

**Event:** `viewer-count`

**Payload:**
```json
{
  "eventId": "1",
  "count": 1248
}
```

#### Stream Started

Notification when a stream starts.

**Event:** `stream-started`

**Payload:**
```json
{
  "eventId": "1",
  "name": "NBA Finals Game 7"
}
```

#### Stream Stopped

Notification when a stream stops.

**Event:** `stream-stopped`

**Payload:**
```json
{
  "eventId": "1"
}
```

#### Viewer Pose

Receive pose updates from other viewers.

**Event:** `viewer-pose`

**Payload:**
```json
{
  "socketId": "abc123",
  "pose": {
    "position": { "x": 0, "y": 1.6, "z": 5 },
    "rotation": { "x": 0, "y": 0, "z": 0 }
  }
}
```

#### Chat Message

Broadcast chat message from viewers.

**Event:** `chat-message`

**Payload:**
```json
{
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
  "message": "Great game!",
  "timestamp": 1702345678000
}
```

#### Stream Error

Error notification.

**Event:** `stream-error`

**Payload:**
```json
{
  "error": "Access denied - no valid pass found"
}
```

---

## Smart Contract Functions

### SPRXToken

**Contract Address:** Set in `.env` after deployment

#### Read Functions

- `name() → string`: Token name
- `symbol() → string`: Token symbol
- `totalSupply() → uint256`: Total token supply
- `balanceOf(address account) → uint256`: Get account balance
- `rewards(address account) → uint256`: Get rewards for account

#### Write Functions

- `transfer(address to, uint256 amount) → bool`: Transfer tokens
- `approve(address spender, uint256 amount) → bool`: Approve spending
- `rewardUser(address user, uint256 amount)`: Reward user (owner only)
- `batchReward(address[] users, uint256[] amounts)`: Batch reward (owner only)
- `burn(uint256 amount)`: Burn tokens

---

### StreamingAccessPass

**Contract Address:** Set in `.env` after deployment

#### Read Functions

- `name() → string`: NFT collection name
- `symbol() → string`: NFT symbol
- `balanceOf(address owner) → uint256`: Get NFT balance
- `ownerOf(uint256 tokenId) → address`: Get NFT owner
- `tokenURI(uint256 tokenId) → string`: Get token metadata URI
- `isValidPass(uint256 tokenId) → bool`: Check if pass is valid
- `hasEventAccess(uint256 eventId, address user) → bool`: Check event access
- `getAccessPassDetails(uint256 tokenId) → (uint256, uint256, string, bool)`: Get pass details

#### Write Functions

- `mintAccessPass(address to, uint256 eventId, uint256 duration, string accessLevel, string uri) → uint256`: Mint pass (owner only)
- `deactivatePass(uint256 tokenId)`: Deactivate pass (owner only)

---

### StreamingRightsManager

**Contract Address:** Set in `.env` after deployment

#### Read Functions

- `sprxToken() → address`: Get SPRX token address
- `accessPassNFT() → address`: Get Access Pass NFT address
- `events(uint256 eventId) → Event`: Get event struct
- `platformFeePercentage() → uint256`: Get platform fee percentage
- `totalPlatformRevenue() → uint256`: Get total platform revenue
- `getEventDetails(uint256 eventId) → (...)`: Get event details

#### Write Functions

- `createEvent(string name, string description, uint256 startTime, uint256 endTime, uint256 standardPrice, uint256 vipPrice, uint256 premiumPrice) → uint256`: Create event
- `purchaseAccess(uint256 eventId, string accessLevel)`: Purchase event access
- `updatePlatformFee(uint256 newFeePercentage)`: Update platform fee (owner only)
- `deactivateEvent(uint256 eventId)`: Deactivate event (organizer/owner only)

---

## Error Codes

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found (event not found)
- `500` - Internal Server Error

### Smart Contract Errors

- `"Invalid user address"` - Zero address provided
- `"Amount must be greater than 0"` - Invalid token amount
- `"Insufficient SPRX tokens"` - Not enough tokens for purchase
- `"Event is not active"` - Event has been deactivated
- `"Event has ended"` - Event is past end time
- `"Already purchased access"` - User already has access
- `"Invalid access level"` - Access level must be standard, vip, or premium
- `"Start time must be in the future"` - Invalid event start time
- `"Not authorized"` - Caller is not authorized

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider implementing rate limiting on API endpoints.

## Authentication

- REST API: No authentication currently (add JWT or similar for production)
- WebSocket: Event access verified via blockchain before joining streams
- Smart Contracts: Authenticated via wallet signatures

---

## Example Usage

### JavaScript/Node.js

```javascript
const axios = require('axios');
const io = require('socket.io-client');

// Get events
const events = await axios.get('http://localhost:3000/api/events');
console.log(events.data);

// Connect to stream
const socket = io('http://localhost:3000');
socket.emit('join-stream', {
  eventId: '1',
  userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'
});

socket.on('stream-joined', (data) => {
  console.log('Joined stream:', data);
});
```

### Python

```python
import requests
import socketio

# Get events
response = requests.get('http://localhost:3000/api/events')
events = response.json()

# Connect to stream
sio = socketio.Client()
sio.connect('http://localhost:3000')

sio.emit('join-stream', {
    'eventId': '1',
    'userAddress': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'
})
```
