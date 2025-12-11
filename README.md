# Tokenized_SPRX  
A Tokenized AR/VR Streaming Platform for Real-Time Sports Events Using Blockchain Smart Contracts

## Overview
Tokenized_SPRX is a prototype decentralized platform that combines **AR/VR-based sports streaming** with **blockchain-enabled access control and monetization**. The system enables users to securely access live VR sports experiences using blockchain tokens and NFTs. It integrates a React/Vite DApp, Node.js/Express server for off-chain coordination, and Hardhat smart contracts for on-chain verification and ownership models.

---

## Core Features
- **AR/VR Streaming Support**: Real-time sports streaming optimized for VR devices (Oculus/Meta Quest).
- **Blockchain Integration**:
  - ERC-721 NFTs for event ticketing and access validation.
  - ERC-20 burnable tokens for pay-per-view and reward mechanisms.
- **Smart Contract Architecture**: Multichain-ready with transaction optimization features.
- **Secure Access Control**: Token-verified entitlement system for authenticated streaming sessions.
- **Hybrid Off-chain / On-chain Model**: Ensures low latency streaming with blockchain-backed validations.
- **Transparent Revenue and Ownership**: Tokenized payment flows for creators, event hosts, and viewers.

---

## Folder Structure

tokenized_sprx/
│
├── frontend/ # React + Vite-based DApp
│ ├── src/
│ ├── public/
│ ├── package.json
│ └── vite.config.js
│
├── server/ # Node.js + Express backend
│ ├── src/
│ ├── routes/
│ ├── controllers/
│ ├── config/
│ ├── package.json
│ └── server.js
│
├── contracts/ # Hardhat smart contracts
│ ├── contracts/
│ ├── scripts/
│ ├── test/
│ ├── hardhat.config.js
│ └── package.json
│
└── README.md


---

## Technology Stack

| Layer | Technology |
|-------|-------------|
| **Frontend DApp** | React, Vite, ethers.js, Web3Modal |
| **Backend Server** | Node.js, Express, IPFS (optional for media), Socket.io |
| **Smart Contracts** | Solidity, Hardhat, OpenZeppelin, Ethereum / Polygon Testnets |
| **Database (optional)** | MongoDB or Redis (for session & event metadata) |
| **Streaming** | WebRTC / custom RTMP ingest integrated with VR SDK |

---

## Getting Started

### Prerequisites
- Node.js >= 18.x  
- npm or yarn  
- MetaMask or compatible wallet  
- Hardhat / Foundry for contract deployment  
- (Optional) Oculus/Meta Quest for VR testing  

---

## Setup Guide

### 1. Clone the Repository

git clone https://github.com/<your-username>/tokenized_sprx.git
cd tokenized_sprx


---

### 2. Setting up the Smart Contracts (Hardhat)

cd contracts
npm install


Update **.env** file:

PRIVATE_KEY=<your-metamask-private-key>
ALCHEMY_API_KEY=<your-alchemy-or-infura-key>
NETWORK=polygon_mumbai

Compile and deploy contracts:

npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai


This will output contract addresses for:
- `TokenizedAccess.sol` (ERC-721 Ticketing)
- `StreamToken.sol` (ERC-20 Burnable Token)

Copy deployed addresses to the frontend and server configuration files.

---

### 3. Setting up the Server (Node/Express)

cd ../server
npm install


Environment configuration `.env`:

PORT=5000
MONGO_URI=<your-mongodb-uri>
CONTRACT_ADDRESS=<nft-contract-address>
TOKEN_ADDRESS=<erc20-contract-address>
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/<API_KEY>


Start the development server:

npm run dev

Server will start at `http://localhost:5000`.

---

### 4. Setting up the Frontend (React + Vite)

cd ../frontend
npm install


Create `.env` file:

VITE_APP_BACKEND_URL=http://localhost:5000
VITE_APP_CONTRACT_ADDRESS=<nft-contract-address>
VITE_APP_TOKEN_ADDRESS=<erc20-contract-address>
VITE_APP_NETWORK=mumbai


Run the frontend:

npm run dev

Frontend will start at `http://localhost:5173`.

---

## DApp Functionalities
1. **User Authentication**: Wallet connection and token verification via MetaMask.  
2. **NFT Ticketing**: Mint or purchase ERC-721 NFT tickets enabling access to live streams.  
3. **Pay-per-view System**: Burn ERC-20 tokens for time-based or event-based access.  
4. **Real-Time Streaming**: Low-latency VR content served via hybrid WebRTC and on-chain validations.  
5. **Revenue Distribution**: Automatic allocation of funds among event hosts and rights owners using smart contracts.  

---

## Smart Contract Details

### TokenizedAccess.sol (ERC-721)
- Each NFT represents ownership and access entitlement to a sports event.  
- Verified by backend before granting streaming access.  

### StreamToken.sol (ERC-20 Burnable)
- Used as a medium for pay-per-view access.  
- Burned upon transaction to validate access tokens securely.  

---

## API Endpoints (Server)

| Method | Endpoint | Description |
|--------|-----------|-------------|
| `GET` | `/api/events` | Fetch active sports events metadata |
| `POST` | `/api/ticket/verify` | Validate NFT ownership for access |
| `POST` | `/api/stream/start` | Initiate streaming session |
| `POST` | `/api/stream/end` | End current stream and record session logs |

---

## Development Workflow
1. Deploy/Update contracts via Hardhat.  
2. Update deployed contract addresses in both frontend and server `.env` files.  
3. Launch Node backend and verify API endpoints.  
4. Run the React DApp and connect wallet.  
5. Test NFT minting, token burn, and streaming sync.  

---

## Example .env Templates

### contracts/.env

PRIVATE_KEY=
ALCHEMY_API_KEY=
NETWORK=polygon_mumbai


### server/.env

PORT=5000
MONGO_URI=
CONTRACT_ADDRESS=
TOKEN_ADDRESS=
RPC_URL=


### frontend/.env

VITE_APP_BACKEND_URL=http://localhost:5000
VITE_APP_CONTRACT_ADDRESS=
VITE_APP_TOKEN_ADDRESS=
VITE_APP_NETWORK=polygon_mumbai


---

## Future Enhancements
- Full AR/VR integration using Unity or WebXR.  
- Layer-2 scaling (Arbitrum / Base) for cost optimization.  
- IPFS / Livepeer integration for decentralized content delivery.  
- DAO governance for sports event curation.  
- Reward system for active user participation.  

---

## License
This project is released under the **MIT License**.

---

## Author
**Tokenized_SPRX Prototype**  
Developed by [YSandy13869]  
© 2025, All rights reserved.
