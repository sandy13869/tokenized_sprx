# SPRX Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    Web Frontend (React)                       │      │
│  │  - Wallet Connection (MetaMask)                              │      │
│  │  - Event Discovery & Browsing                                │      │
│  │  - Purchase Access Passes                                    │      │
│  │  - AR/VR Stream Viewer (Three.js)                           │      │
│  │  - Live Chat Interface                                       │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS/WSS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              Backend Server (Node.js/Express)                │      │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐│      │
│  │  │  REST API      │  │  WebSocket/      │  │   Event      ││      │
│  │  │  - Events      │  │  Socket.IO       │  │  Management  ││      │
│  │  │  - Health      │  │  - Live Streaming│  │  - Creation  ││      │
│  │  │  - Verification│  │  - Chat          │  │  - Updates   ││      │
│  │  │                │  │  - Pose Sync     │  │  - Analytics ││      │
│  │  └────────────────┘  └──────────────────┘  └──────────────┘│      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Web3/RPC
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                  Ethereum Network (or L2)                     │      │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐│      │
│  │  │  SPRXToken     │  │  Streaming       │  │  Streaming   ││      │
│  │  │  (ERC-20)      │  │  AccessPass      │  │  Rights      ││      │
│  │  │                │  │  (ERC-721)       │  │  Manager     ││      │
│  │  │  - Transfer    │  │                  │  │              ││      │
│  │  │  - Reward      │  │  - Mint Pass     │  │  - Create    ││      │
│  │  │  - Burn        │  │  - Verify Access │  │    Event     ││      │
│  │  │  - Approve     │  │  - Time-based    │  │  - Purchase  ││      │
│  │  │                │  │    Validation    │  │  - Revenue   ││      │
│  │  └────────────────┘  └──────────────────┘  └──────────────┘│      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration & Wallet Connection

```
User → Frontend → MetaMask → Blockchain
  │
  └─> Connect Wallet
       ├─> Get Account Address
       ├─> Check Network
       └─> Display Balance
```

### 2. Event Discovery

```
User → Frontend → Backend API → Response
  │        │
  │        └─> GET /api/events
  │             └─> Returns: Event list with details
  │
  └─> Display events in UI
       ├─> Filter by status (live/upcoming)
       ├─> Show pricing tiers
       └─> Show viewer count
```

### 3. Access Pass Purchase Flow

```
User → Frontend → Smart Contracts → Backend
  │        │           │
  │        │           ├─> 1. Approve SPRX tokens
  │        │           │    (SPRXToken.approve)
  │        │           │
  │        │           ├─> 2. Purchase access
  │        │           │    (StreamingRightsManager.purchaseAccess)
  │        │           │
  │        │           ├─> 3. Transfer tokens
  │        │           │    (User → Contract)
  │        │           │
  │        │           └─> 4. Mint NFT pass
  │        │                (StreamingAccessPass.mintAccessPass)
  │        │
  │        └─> Event: AccessPassMinted
  │
  └─> Update UI: Show pass ownership
```

### 4. Stream Viewing Flow

```
User → Frontend → Backend WebSocket → Blockchain Verification
  │        │           │                    │
  │        │           │                    └─> Verify NFT ownership
  │        │           │                         (hasEventAccess)
  │        │           │
  │        │           ├─> Join stream room
  │        │           ├─> Receive video stream
  │        │           ├─> Get viewer count
  │        │           └─> Enable chat
  │        │
  │        └─> Render AR/VR viewer
  │             ├─> Load 3D scene (Three.js)
  │             ├─> Update camera pose
  │             └─> Display real-time data
  │
  └─> User interaction
       ├─> Navigate 3D space
       ├─> Send chat messages
       └─> Share pose with other viewers
```

### 5. Real-time Communication Flow

```
WebSocket Connection (Socket.IO)

Client A                Backend                Client B
   │                       │                       │
   ├─> join-stream ───────>│                       │
   │   {eventId, address}  │                       │
   │                       ├─> Verify access       │
   │                       │   (blockchain)        │
   │<──── stream-joined ───┤                       │
   │                       │                       │
   │                       │<──── join-stream ─────┤
   │                       ├─> Verify access       │
   │                       ├──── stream-joined ───>│
   │                       │                       │
   ├─> chat-message ──────>│                       │
   │   "Hello!"            │                       │
   │                       ├──── chat-message ────>│
   │<──── chat-message ────┤      "Hello!"        │
   │                       │                       │
   ├─> pose-update ───────>│                       │
   │   {x,y,z,rot}         │                       │
   │                       ├──── viewer-pose ─────>│
   │                       │      {x,y,z,rot}      │
```

## Component Interactions

### Smart Contract Interactions

```
┌──────────────────────┐
│ StreamingRightsManager│
└──────────┬───────────┘
           │
           ├─> Uses SPRXToken
           │   ├─> transferFrom() - Take payment
           │   └─> balanceOf() - Check balance
           │
           └─> Uses StreamingAccessPass
               ├─> mintAccessPass() - Create NFT
               └─> hasEventAccess() - Verify access
```

### Backend Components

```
┌──────────────────────┐
│   Express Server     │
│                      │
│  ┌────────────────┐ │
│  │  REST Routes   │ │
│  │  /api/events   │ │
│  │  /api/verify   │ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │  Socket.IO     │ │
│  │  - Rooms       │ │
│  │  - Events      │ │
│  │  - Broadcasting│ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │ State Manager  │ │
│  │ - activeStreams│ │
│  │ - viewerCounts │ │
│  └────────────────┘ │
└──────────────────────┘
```

### Frontend Components

```
┌──────────────────────┐
│       App.jsx        │
│                      │
│  ┌────────────────┐ │
│  │ WalletConnect  │ │
│  │ - MetaMask     │ │
│  │ - Account      │ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │   EventList    │ │
│  │ - Browse       │ │
│  │ - Filter       │ │
│  │ - Purchase     │ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │ StreamViewer   │ │
│  │ - Video        │ │
│  │ - Chat         │ │
│  │ - Controls     │ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │  ARVRViewer    │ │
│  │ - 3D Scene     │ │
│  │ - Camera       │ │
│  │ - Stadium      │ │
│  └────────────────┘ │
└──────────────────────┘
```

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────┐
│         Security Layers                  │
├─────────────────────────────────────────┤
│ 1. Wallet Authentication (MetaMask)     │
│    - Cryptographic signatures           │
│    - Account ownership verification     │
├─────────────────────────────────────────┤
│ 2. Smart Contract Access Control        │
│    - Ownable pattern                    │
│    - NFT ownership verification         │
│    - Time-based validation              │
├─────────────────────────────────────────┤
│ 3. Backend Verification                 │
│    - Access pass validation             │
│    - Event status checks                │
│    - Rate limiting (recommended)        │
├─────────────────────────────────────────┤
│ 4. Frontend Validation                  │
│    - Input sanitization                 │
│    - Network checks                     │
│    - Error handling                     │
└─────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│ Backend 1 │  │ Backend 2 │  │ Backend 3 │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      └──────────────┼──────────────┘
                     │
            ┌────────▼────────┐
            │  Load Balancer  │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   Redis Adapter │
            │  (Socket.IO)    │
            └─────────────────┘
```

### Data Layer

```
┌──────────────────────────────────────────┐
│          Blockchain (Immutable)          │
│  - Token balances                        │
│  - NFT ownership                         │
│  - Event metadata                        │
└──────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│       Off-chain Storage (Optional)       │
│  - Video streams (CDN)                   │
│  - Chat history (Database)               │
│  - Analytics (Time-series DB)            │
└──────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **3D Rendering**: Three.js, React Three Fiber
- **Web3**: Ethers.js v6
- **Routing**: React Router
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **CORS**: cors middleware
- **Environment**: dotenv

### Blockchain
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat
- **Libraries**: OpenZeppelin
- **Testing**: Hardhat Chai Matchers
- **Network**: Ethereum (or L2)

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Testing**: Mocha, Chai
- **Deployment**: Hardhat deploy scripts

## Performance Optimizations

1. **Smart Contract Gas Optimization**
   - Batch operations where possible
   - Efficient storage patterns
   - Event emissions for off-chain indexing

2. **Backend Optimization**
   - Connection pooling
   - Caching frequently accessed data
   - WebSocket room management

3. **Frontend Optimization**
   - Code splitting
   - Lazy loading components
   - 3D scene optimization (LOD)
   - WebSocket reconnection logic

## Monitoring & Analytics

```
┌─────────────────────────────────────────┐
│         Metrics to Monitor              │
├─────────────────────────────────────────┤
│ Blockchain                              │
│  - Gas usage per transaction            │
│  - Token circulation                    │
│  - NFT minting rate                     │
│  - Event creation frequency             │
├─────────────────────────────────────────┤
│ Backend                                 │
│  - API response times                   │
│  - WebSocket connection count           │
│  - Active stream count                  │
│  - Error rates                          │
├─────────────────────────────────────────┤
│ Business                                │
│  - Total users                          │
│  - Pass purchases                       │
│  - Concurrent viewers                   │
│  - Revenue (platform fees)              │
└─────────────────────────────────────────┘
```

## Future Enhancements

1. **Layer 2 Integration**: Deploy to Polygon, Arbitrum for lower fees
2. **IPFS Storage**: Decentralized metadata and content storage
3. **DAO Governance**: Community-driven platform decisions
4. **Mobile Apps**: React Native for iOS/Android
5. **VR Headset Support**: Native Oculus/HTC Vive integration
6. **Token Staking**: Earn rewards for holding SPRX
7. **Creator Tools**: Enable anyone to stream events
8. **Analytics Dashboard**: Comprehensive metrics for organizers
