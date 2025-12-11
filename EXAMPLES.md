# Usage Examples

This document provides practical examples of using the SPRX platform for different scenarios.

## Table of Contents

1. [For Users: Watching Events](#for-users-watching-events)
2. [For Event Organizers: Creating Events](#for-event-organizers-creating-events)
3. [For Developers: Integration Examples](#for-developers-integration-examples)

---

## For Users: Watching Events

### Step 1: Connect Your Wallet

1. Open the SPRX platform in your browser: `http://localhost:5173`
2. Click "Connect Wallet" in the top right
3. Select MetaMask and approve the connection
4. Your address will be displayed once connected

### Step 2: Browse Events

The home page displays all available events:
- **Live events** are marked with a 🔴 LIVE badge
- **Upcoming events** show their start date
- Each event displays:
  - Name and description
  - Current viewer count
  - Pricing for different tiers (Standard, VIP, Premium AR/VR)

### Step 3: Purchase Access Pass

1. Find an event you want to watch
2. Click "Purchase Pass" button
3. Choose your access level:
   - **Standard**: Basic streaming access (10 SPRX)
   - **VIP**: Enhanced quality + chat features (25 SPRX)
   - **Premium AR/VR**: Full AR/VR experience (50 SPRX)
4. Approve the SPRX token spending in MetaMask (first time only)
5. Confirm the purchase transaction
6. Your NFT access pass will be minted automatically

### Step 4: Watch the Event

1. Click "Watch Now" on the event card
2. The stream viewer will load
3. For VR mode, click the "🥽 VR Mode" button
4. Use your mouse to navigate the 3D stadium:
   - **Left-click + drag**: Rotate camera
   - **Scroll**: Zoom in/out
   - **Right-click + drag**: Pan camera

### Step 5: Interact with Other Viewers

- Use the chat panel on the right to send messages
- See other viewers' positions in VR mode
- React to exciting moments with the community

---

## For Event Organizers: Creating Events

### Example: Creating an NBA Finals Event

#### 1. Deploy Contracts (One-time setup)

```bash
# Start local Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

#### 2. Create Event via Smart Contract

```javascript
const { ethers } = require("ethers");

// Connect to your wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Contract address (from deployment)
const rightsManagerAddress = "0x...";
const rightsManagerABI = [...]; // Import from artifacts

// Create contract instance
const rightsManager = new ethers.Contract(
  rightsManagerAddress,
  rightsManagerABI,
  signer
);

// Event details
const eventName = "NBA Finals 2024 - Game 7";
const description = "Championship game with immersive AR/VR viewing";
const startTime = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
const endTime = startTime + 10800; // 3 hours duration
const standardPrice = ethers.parseEther("10");
const vipPrice = ethers.parseEther("25");
const premiumPrice = ethers.parseEther("50");

// Create event
const tx = await rightsManager.createEvent(
  eventName,
  description,
  startTime,
  endTime,
  standardPrice,
  vipPrice,
  premiumPrice
);

await tx.wait();
console.log("Event created!");
```

#### 3. Register Event with Backend

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0",
    "name": "NBA Finals 2024 - Game 7",
    "description": "Championship game with immersive AR/VR viewing",
    "startTime": 1702345678000,
    "endTime": 1702356478000,
    "streamUrl": "rtmp://your-stream-server/live/event1"
  }'
```

#### 4. Start Streaming

```bash
# When ready to go live
curl -X POST http://localhost:3000/api/events/0/start
```

#### 5. Monitor Event

```javascript
// Check event details
const eventDetails = await rightsManager.getEventDetails(0);
console.log("Total viewers:", eventDetails.totalViewers);

// Get current viewers from backend
const response = await fetch('http://localhost:3000/api/events/0');
const data = await response.json();
console.log("Currently watching:", data.event.viewers);
```

---

## For Developers: Integration Examples

### Example 1: Check User's Token Balance

```javascript
import { ethers } from 'ethers';

async function checkSPRXBalance(userAddress) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];
  
  const token = new ethers.Contract(tokenAddress, tokenABI, provider);
  
  const balance = await token.balanceOf(userAddress);
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  
  const formattedBalance = ethers.formatUnits(balance, decimals);
  
  console.log(`Balance: ${formattedBalance} ${symbol}`);
  return formattedBalance;
}

// Usage
checkSPRXBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5");
```

### Example 2: Verify Access Pass Ownership

```javascript
async function verifyAccessPass(userAddress, eventId) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const passAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  const passABI = [
    "function hasEventAccess(uint256, address) view returns (bool)",
    "function balanceOf(address) view returns (uint256)"
  ];
  
  const accessPass = new ethers.Contract(passAddress, passABI, provider);
  
  const hasAccess = await accessPass.hasEventAccess(eventId, userAddress);
  const nftCount = await accessPass.balanceOf(userAddress);
  
  console.log(`Has access to event ${eventId}: ${hasAccess}`);
  console.log(`Total NFTs owned: ${nftCount}`);
  
  return hasAccess;
}

// Usage
verifyAccessPass("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5", 0);
```

### Example 3: Purchase Access with Frontend

```javascript
import { ethers } from 'ethers';

async function purchaseEventAccess(eventId, accessLevel) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const managerAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    
    // Get prices from contract
    const managerABI = [
      "function getEventDetails(uint256) view returns (string,string,uint256,uint256,uint256,uint256,uint256,bool,uint256)",
      "function purchaseAccess(uint256, string)"
    ];
    
    const manager = new ethers.Contract(managerAddress, managerABI, signer);
    const details = await manager.getEventDetails(eventId);
    
    // Determine price based on access level
    let price;
    switch(accessLevel) {
      case 'standard': price = details[4]; break;
      case 'vip': price = details[5]; break;
      case 'premium': price = details[6]; break;
      default: throw new Error('Invalid access level');
    }
    
    // Approve token spending
    const tokenABI = ["function approve(address, uint256) returns (bool)"];
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    console.log("Approving SPRX tokens...");
    const approveTx = await token.approve(managerAddress, price);
    await approveTx.wait();
    
    // Purchase access
    console.log("Purchasing access pass...");
    const purchaseTx = await manager.purchaseAccess(eventId, accessLevel);
    await purchaseTx.wait();
    
    console.log("Access pass purchased successfully!");
    return true;
  } catch (error) {
    console.error("Purchase failed:", error);
    return false;
  }
}

// Usage
purchaseEventAccess(0, 'premium');
```

### Example 4: Real-time WebSocket Integration

```javascript
import { io } from 'socket.io-client';

class StreamClient {
  constructor(serverUrl = 'http://localhost:3000') {
    this.socket = io(serverUrl);
    this.setupListeners();
  }
  
  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to stream server');
    });
    
    this.socket.on('stream-joined', (data) => {
      console.log('Joined stream:', data);
    });
    
    this.socket.on('viewer-count', (data) => {
      console.log('Viewer count updated:', data.count);
      this.updateViewerCount(data.count);
    });
    
    this.socket.on('chat-message', (data) => {
      console.log('Chat message:', data);
      this.displayChatMessage(data);
    });
    
    this.socket.on('stream-error', (error) => {
      console.error('Stream error:', error);
    });
  }
  
  joinStream(eventId, userAddress) {
    this.socket.emit('join-stream', { eventId, userAddress });
  }
  
  leaveStream(eventId) {
    this.socket.emit('leave-stream', { eventId });
  }
  
  sendChatMessage(eventId, message, userAddress) {
    this.socket.emit('chat-message', {
      eventId,
      message,
      userAddress
    });
  }
  
  updatePose(eventId, pose) {
    this.socket.emit('pose-update', { eventId, pose });
  }
  
  updateViewerCount(count) {
    // Update UI with viewer count
    document.getElementById('viewer-count').textContent = count;
  }
  
  displayChatMessage(data) {
    // Update UI with new message
    const chatBox = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.textContent = `${data.userAddress}: ${data.message}`;
    chatBox.appendChild(messageEl);
  }
}

// Usage
const client = new StreamClient();
client.joinStream('1', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5');

// Send a message
client.sendChatMessage('1', 'Great game!', '0x742d35Cc...');

// Update VR pose
client.updatePose('1', {
  position: { x: 0, y: 1.6, z: 5 },
  rotation: { x: 0, y: 0, z: 0 }
});
```

### Example 5: Reward Users for Engagement

```javascript
// Backend reward script (run by platform owner)
async function rewardActiveViewers(eventId, rewardPerViewer) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tokenABI = [
    "function batchReward(address[], uint256[])"
  ];
  
  const token = new ethers.Contract(tokenAddress, tokenABI, wallet);
  
  // Get active viewers from backend
  const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
  const data = await response.json();
  
  // Assuming we track viewer addresses (would need to implement)
  const viewers = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  ];
  
  const amounts = viewers.map(() => ethers.parseEther(rewardPerViewer));
  
  console.log(`Rewarding ${viewers.length} viewers...`);
  const tx = await token.batchReward(viewers, amounts);
  await tx.wait();
  
  console.log("Rewards distributed!");
}

// Usage: Reward viewers with 5 SPRX each
rewardActiveViewers(0, "5");
```

### Example 6: Create AR/VR Custom Scene

```javascript
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';

function CustomStadiumScene({ eventId }) {
  return (
    <Canvas camera={{ position: [0, 5, 20] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#4a8c2a" />
      </mesh>
      
      {/* Scoreboard */}
      <Text
        position={[0, 8, -10]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Event #{eventId} - LIVE
      </Text>
      
      {/* Viewer avatars (example) */}
      <Sphere position={[5, 2, 5]} args={[0.5]}>
        <meshStandardMaterial color="blue" />
      </Sphere>
      
      <OrbitControls />
    </Canvas>
  );
}

export default CustomStadiumScene;
```

### Example 7: Event Analytics Dashboard

```javascript
async function getEventAnalytics(eventId) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const managerAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  const managerABI = [
    "function getEventDetails(uint256) view returns (string,string,uint256,uint256,uint256,uint256,uint256,bool,uint256)"
  ];
  
  const manager = new ethers.Contract(managerAddress, managerABI, provider);
  const details = await manager.getEventDetails(eventId);
  
  // Get backend stats
  const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
  const backendData = await response.json();
  
  return {
    name: details[0],
    description: details[1],
    startTime: new Date(Number(details[2]) * 1000),
    endTime: new Date(Number(details[3]) * 1000),
    pricing: {
      standard: ethers.formatEther(details[4]),
      vip: ethers.formatEther(details[5]),
      premium: ethers.formatEther(details[6])
    },
    isActive: details[7],
    totalViewers: Number(details[8]),
    currentViewers: backendData.event.viewers,
    isLive: backendData.event.isLive
  };
}

// Usage
const analytics = await getEventAnalytics(0);
console.log("Event Analytics:", analytics);
```

---

## Common Workflows

### Workflow 1: Complete User Journey

1. **Connect Wallet** → User connects MetaMask
2. **Browse Events** → User sees upcoming NBA game
3. **Check Balance** → User verifies they have 50 SPRX
4. **Purchase Premium Pass** → User buys Premium AR/VR access
5. **Wait for Event** → Event starts (organizer starts stream)
6. **Join Stream** → User clicks "Watch Now"
7. **Enable VR Mode** → User activates 3D viewer
8. **Navigate Stadium** → User explores different camera angles
9. **Chat with Others** → User discusses game in live chat
10. **Event Ends** → NFT pass expires, stream closes

### Workflow 2: Organizer Event Management

1. **Deploy Contracts** → One-time platform setup
2. **Create Event** → Organizer creates event on blockchain
3. **Register Backend** → Organizer registers event with streaming server
4. **Promote Event** → Users discover and purchase passes
5. **Start Stream** → Organizer initiates live broadcast
6. **Monitor Viewers** → Track real-time viewer count
7. **End Stream** → Organizer stops broadcast
8. **Collect Revenue** → Platform distributes payments

---

## Testing Tips

### Test on Local Network

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start backend
npm run server

# Terminal 4: Start frontend
cd frontend && npm run dev

# Terminal 5: Run tests
npm test
```

### Use Test Accounts

Hardhat provides test accounts with ETH:
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
```

Import these into MetaMask for testing.

---

## Troubleshooting

### Issue: Transaction Fails

**Solution**: Check that:
1. You have sufficient SPRX tokens
2. You've approved token spending
3. Event is still active
4. You haven't already purchased access

### Issue: Can't Connect to Stream

**Solution**: Verify:
1. Backend server is running
2. You own a valid access pass NFT
3. Event is currently live
4. WebSocket connection is established

### Issue: VR Mode Not Working

**Solution**: Ensure:
1. Browser supports WebGL
2. Hardware acceleration is enabled
3. Three.js loaded correctly
4. No console errors

---

For more help, see the full documentation in README.md or open an issue on GitHub.
