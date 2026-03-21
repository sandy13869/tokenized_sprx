# Tokenized SPRX Frontend

React + Vite DApp for MetaMask connection, Polygon mainnet compatibility, and on-chain stream access actions.

## Features

- RainbowKit + wagmi wallet UX (MetaMask compatible)
- Polygon Mainnet chain enforcement (`137`)
- Contract actions for minting tickets, burning tokens, and stream start
- Live event cards sourced from backend API

## Environment

Create a `.env` file in `Frontend/`:

```env
VITE_APP_BACKEND_URL=http://localhost:5000
VITE_APP_TICKET_ADDRESS=
VITE_APP_TOKEN_ADDRESS=
VITE_APP_ACCESS_ADDRESS=
VITE_APP_CHAIN_ID=137
VITE_WALLETCONNECT_PROJECT_ID=tokenized-sprx-demo
```

`VITE_WALLETCONNECT_PROJECT_ID` can be replaced with your real WalletConnect Cloud project ID.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run lint
```
