# Deployment Guide

This guide will walk you through deploying the SPRX platform to various environments.

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git
- MetaMask or similar Web3 wallet
- ETH for gas fees (testnet or mainnet)

---

## Local Development Deployment

### 1. Setup Project

```bash
# Clone repository
git clone https://github.com/sandy13869/tokenized_sprx.git
cd tokenized_sprx

# Install dependencies
npm install
```

### 2. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

This will:
- Start a local Ethereum node on `http://127.0.0.1:8545`
- Create test accounts with ETH
- Display account addresses and private keys

### 3. Deploy Smart Contracts

```bash
# Terminal 2: Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost
```

Expected output:
```
Deploying SPRX Platform contracts...
SPRXToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
StreamingAccessPass deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
StreamingRightsManager deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

=== Deployment Summary ===
SPRXToken: 0x5FbDB2315678afecb367f032d93F642f64180aa3
StreamingAccessPass: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
StreamingRightsManager: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 4. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Update `.env` with deployed contract addresses:

```env
TOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NFT_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
STREAMING_RIGHTS_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 5. Start Backend Server

```bash
# Terminal 3: Start backend
npm run server
```

Expected output:
```
✅ SPRX Streaming Server running on port 3000
📡 WebSocket server ready for connections
🔗 Contract Addresses:
   Token: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Access Pass: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   Rights Manager: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 6. Start Frontend

```bash
# Terminal 4: Start frontend
cd frontend
npm install
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 7. Configure MetaMask

1. Open MetaMask
2. Add network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. Import test account using private key from Hardhat node output

### 8. Access Application

Open browser to `http://localhost:5173`

---

## Testnet Deployment (Sepolia)

### 1. Get Sepolia ETH

Get testnet ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 2. Configure .env for Sepolia

```env
PRIVATE_KEY=your_wallet_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

Get Infura API key from: https://infura.io/

### 3. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will take a few minutes. Save the contract addresses.

### 4. Verify Contracts (Optional)

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### 5. Update Frontend Configuration

Update `frontend/src/utils/contracts.js` with Sepolia contract addresses and network configuration.

### 6. Deploy Backend

Deploy backend to a hosting service (Heroku, Railway, Render, etc.)

Example for Railway:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### 7. Deploy Frontend

Build and deploy frontend to Vercel, Netlify, or similar:

```bash
cd frontend
npm run build

# Deploy to Vercel
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod
```

---

## Mainnet Deployment

⚠️ **WARNING**: Deploying to mainnet requires real ETH and involves financial risk. Ensure:
- Contracts are thoroughly tested
- Code is audited by professionals
- You understand gas costs
- You have backup/recovery plans

### 1. Security Audit

Before mainnet deployment:
1. Complete security audit of all smart contracts
2. Test extensively on testnet
3. Conduct penetration testing
4. Review access controls

### 2. Prepare Mainnet Wallet

1. Create new wallet specifically for deployment
2. Fund with sufficient ETH for deployment (estimate gas)
3. Never share private keys

### 3. Configure Environment

```env
PRIVATE_KEY=your_secure_mainnet_private_key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
```

### 4. Deploy Contracts

```bash
# Estimate gas first
npx hardhat run scripts/deploy.js --network mainnet --dry-run

# Deploy
npx hardhat run scripts/deploy.js --network mainnet
```

### 5. Verify Contracts

```bash
npx hardhat verify --network mainnet CONTRACT_ADDRESS
```

### 6. Production Backend Setup

Deploy backend to production environment:

**Recommended Services:**
- AWS EC2/ECS
- Google Cloud Run
- Azure App Service
- DigitalOcean Droplets

**Configuration:**
- Use environment variables
- Enable HTTPS/SSL
- Set up monitoring and logging
- Configure auto-scaling
- Implement rate limiting
- Add authentication

### 7. Production Frontend Setup

**Build optimized frontend:**

```bash
cd frontend
npm run build
```

**Deploy to:**
- Vercel (recommended for React)
- Netlify
- AWS S3 + CloudFront
- Cloudflare Pages

**Configuration:**
- Enable HTTPS
- Configure CDN
- Set up analytics
- Enable error tracking (Sentry)

---

## Post-Deployment Checklist

### Smart Contracts
- [ ] Verify all contracts on Etherscan
- [ ] Test all contract functions
- [ ] Verify ownership transfers
- [ ] Document contract addresses
- [ ] Set up monitoring for contract events

### Backend
- [ ] Test all API endpoints
- [ ] Verify WebSocket connections
- [ ] Set up logging (Winston, Morgan)
- [ ] Configure monitoring (Datadog, New Relic)
- [ ] Set up error tracking (Sentry)
- [ ] Configure backup systems
- [ ] Test failover scenarios
- [ ] Document API endpoints

### Frontend
- [ ] Test wallet connections
- [ ] Verify contract interactions
- [ ] Test all user flows
- [ ] Check mobile responsiveness
- [ ] Test AR/VR features
- [ ] Verify analytics tracking
- [ ] Test on multiple browsers

### Security
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up Web Application Firewall
- [ ] Enable DDoS protection
- [ ] Regular security scans
- [ ] Monitor for vulnerabilities

### Operations
- [ ] Set up alerting
- [ ] Configure backups
- [ ] Document runbooks
- [ ] Train support team
- [ ] Create incident response plan

---

## Monitoring and Maintenance

### Contract Monitoring

Monitor blockchain events:

```javascript
// Monitor token transfers
sprxToken.on("Transfer", (from, to, amount) => {
  console.log(`Transfer: ${from} → ${to}: ${amount}`);
});

// Monitor access pass minting
accessPass.on("AccessPassMinted", (owner, tokenId, eventId) => {
  console.log(`Pass minted: ${tokenId} for event ${eventId}`);
});
```

### Backend Monitoring

Set up health checks:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

### Log Aggregation

Use services like:
- Elasticsearch + Kibana
- Datadog
- Splunk
- CloudWatch

---

## Scaling Considerations

### Backend Scaling

1. **Horizontal Scaling**: Deploy multiple server instances
2. **Load Balancing**: Use NGINX or cloud load balancers
3. **Caching**: Implement Redis for frequently accessed data
4. **Database**: Consider adding PostgreSQL for off-chain data

### WebSocket Scaling

For large-scale deployments:
1. Use Socket.IO with Redis adapter
2. Deploy multiple WebSocket servers
3. Implement sticky sessions

Example:

```javascript
const io = require('socket.io')(server, {
  adapter: require('socket.io-redis')({ 
    host: 'localhost', 
    port: 6379 
  })
});
```

---

## Troubleshooting

### Contract Deployment Fails

**Problem**: Gas estimation failed
**Solution**: Increase gas limit in hardhat.config.js

```javascript
networks: {
  sepolia: {
    gas: 5000000,
    gasPrice: 20000000000
  }
}
```

### Frontend Can't Connect to Contracts

**Problem**: Contract addresses not configured
**Solution**: Verify `.env` has correct addresses and is being loaded

### WebSocket Connection Fails

**Problem**: CORS or network issues
**Solution**: Check CORS configuration in backend:

```javascript
const io = socketIO(server, {
  cors: {
    origin: "https://your-frontend.com",
    methods: ["GET", "POST"]
  }
});
```

### MetaMask Transaction Fails

**Problem**: Insufficient gas or wrong network
**Solution**: 
1. Check you're on correct network
2. Ensure sufficient ETH for gas
3. Try increasing gas limit

---

## Rollback Procedure

If issues occur post-deployment:

1. **Contracts**: Cannot rollback (immutable). Deploy new version if needed.
2. **Backend**: Revert to previous Docker image or commit
3. **Frontend**: Revert deployment on hosting platform

Always test thoroughly before deploying!

---

## Support and Resources

- Hardhat Documentation: https://hardhat.org/docs
- Ethers.js Documentation: https://docs.ethers.org/
- OpenZeppelin: https://docs.openzeppelin.com/
- React Documentation: https://react.dev/

For issues, open a GitHub issue in the repository.
