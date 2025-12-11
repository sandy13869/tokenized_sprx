# 🏆 SPRX - Tokenized AR/VR Sports Streaming Platform

A decentralized AR/VR streaming platform for real-time sports events powered by blockchain smart contracts. This platform enables users to purchase NFT-based access passes using SPRX tokens and experience immersive AR/VR sports viewing with real-time interaction.

## 🌟 Features

### Blockchain Integration
- **ERC-20 SPRX Token**: Platform currency for purchasing access passes and rewarding users
- **NFT Access Passes**: ERC-721 tokens that grant time-limited access to events
- **Smart Contract Rights Management**: Automated event creation, access control, and revenue distribution

### Streaming Platform
- **Real-time WebSocket Communication**: Live streaming with low latency
- **AR/VR 3D Viewer**: Immersive 3D stadium environment using Three.js
- **Live Chat**: Real-time communication between viewers
- **Viewer Analytics**: Track active viewers and engagement metrics

### Frontend Features
- **Wallet Integration**: MetaMask connection for Web3 authentication
- **Event Discovery**: Browse upcoming and live sports events
- **Tiered Access Levels**: Standard, VIP, and Premium AR/VR experiences
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React + Vite) │
│   Three.js AR/VR│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Backend Server │
│ (Express + WS)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Smart Contracts│
│   (Solidity)    │
│  - SPRXToken    │
│  - AccessPass   │
│  - RightsManager│
└─────────────────┘
```

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- MetaMask browser extension
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/sandy13869/tokenized_sprx.git
cd tokenized_sprx
```

### 2. Install Dependencies

```bash
# Install root dependencies (Hardhat, smart contracts)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# - Add your wallet private key for deployment
# - Configure RPC URLs
```

### 4. Compile Smart Contracts

```bash
npm run compile
```

### 5. Run Tests

```bash
npm test
```

### 6. Deploy Contracts (Local)

```bash
# Start a local Hardhat node in one terminal
npx hardhat node

# In another terminal, deploy contracts
npm run deploy
```

Copy the deployed contract addresses to your `.env` file.

### 7. Start Backend Server

```bash
npm run server
```

The backend will start on `http://localhost:3000`

### 8. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📁 Project Structure

```
tokenized_sprx/
├── contracts/               # Solidity smart contracts
│   ├── SPRXToken.sol       # ERC-20 platform token
│   ├── StreamingAccessPass.sol  # ERC-721 NFT passes
│   └── StreamingRightsManager.sol  # Event & access management
├── scripts/                 # Deployment scripts
│   └── deploy.js
├── test/                    # Smart contract tests
│   ├── SPRXToken.test.js
│   └── Streaming.test.js
├── backend/                 # Express.js server
│   └── server.js           # WebSocket streaming server
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── EventList.jsx
│   │   │   ├── StreamViewer.jsx
│   │   │   └── ARVRViewer.jsx
│   │   ├── styles/         # CSS files
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
├── hardhat.config.js       # Hardhat configuration
├── package.json
└── README.md
```

## 🔧 Smart Contracts

### SPRXToken (ERC-20)
Platform token for the ecosystem with reward functionality.

**Key Functions:**
- `rewardUser(address user, uint256 amount)`: Reward tokens to users
- `batchReward(address[] users, uint256[] amounts)`: Batch reward multiple users
- `burn(uint256 amount)`: Burn tokens

### StreamingAccessPass (ERC-721)
NFT-based access passes for events with time-limited validity.

**Key Functions:**
- `mintAccessPass(address to, uint256 eventId, uint256 duration, string accessLevel, string uri)`: Mint access pass
- `isValidPass(uint256 tokenId)`: Check if pass is valid
- `hasEventAccess(uint256 eventId, address user)`: Check user access
- `deactivatePass(uint256 tokenId)`: Deactivate a pass

### StreamingRightsManager
Manages events, purchases, and integrates with tokens and NFTs.

**Key Functions:**
- `createEvent(...)`: Create a new streaming event
- `purchaseAccess(uint256 eventId, string accessLevel)`: Purchase access with SPRX tokens
- `deactivateEvent(uint256 eventId)`: Deactivate an event
- `getEventDetails(uint256 eventId)`: Get event information

## 🌐 API Endpoints

### Backend REST API

#### GET `/health`
Health check endpoint

#### GET `/api/events`
Get all active events

#### GET `/api/events/:eventId`
Get specific event details

#### POST `/api/events`
Create a new event
```json
{
  "eventId": "1",
  "name": "NBA Finals",
  "description": "Championship game",
  "startTime": 1234567890,
  "endTime": 1234578900,
  "streamUrl": "stream://..."
}
```

#### POST `/api/events/:eventId/start`
Start streaming an event

#### POST `/api/events/:eventId/stop`
Stop streaming an event

#### POST `/api/verify-access`
Verify user access to an event

### WebSocket Events

#### Client → Server
- `join-stream`: Join an event stream
- `leave-stream`: Leave an event stream
- `pose-update`: Update AR/VR pose
- `chat-message`: Send chat message

#### Server → Client
- `stream-joined`: Confirmation of joining stream
- `viewer-count`: Updated viewer count
- `stream-started`: Event stream started
- `stream-stopped`: Event stream stopped
- `chat-message`: Broadcast chat message

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npx hardhat test test/SPRXToken.test.js
```

## 🚢 Deployment

### Deploy to Testnet (Sepolia)

1. Configure `.env` with Sepolia RPC URL and private key
2. Get testnet ETH from faucet
3. Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Mainnet

⚠️ **Warning**: Deploying to mainnet requires real ETH. Ensure contracts are audited.

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## 💡 Usage Examples

### Creating an Event

```javascript
const tx = await rightsManager.createEvent(
  "NBA Finals Game 7",
  "Championship game with AR/VR viewing",
  startTime,
  endTime,
  ethers.parseEther("10"),  // standard price
  ethers.parseEther("25"),  // vip price
  ethers.parseEther("50")   // premium price
);
```

### Purchasing Access

```javascript
// Approve tokens
await sprxToken.approve(rightsManagerAddress, price);

// Purchase access
await rightsManager.purchaseAccess(eventId, "premium");
```

### Connecting Wallet (Frontend)

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const accounts = await provider.send('eth_requestAccounts', []);
```

## 🔐 Security Considerations

- All smart contracts use OpenZeppelin's audited contracts
- ReentrancyGuard protects against reentrancy attacks
- Access control via Ownable pattern
- Input validation on all contract functions
- Time-based access validation for NFT passes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for smart contract libraries
- Three.js and React Three Fiber for 3D rendering
- Hardhat for development framework
- Ethers.js for blockchain interaction

## 📞 Support

For questions and support, please open an issue in the GitHub repository.

## 🗺️ Roadmap

- [ ] Multi-chain support (Polygon, BSC, Arbitrum)
- [ ] WebRTC peer-to-peer streaming
- [ ] Mobile app (React Native)
- [ ] VR headset support (Oculus, HTC Vive)
- [ ] Token staking rewards
- [ ] DAO governance for platform decisions
- [ ] Content creator monetization
- [ ] Analytics dashboard
- [ ] Social features (follow, share, highlights)

---

Built with ❤️ for the future of sports streaming
