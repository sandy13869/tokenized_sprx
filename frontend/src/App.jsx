import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WalletConnect from './components/WalletConnect';
import EventList from './components/EventList';
import StreamViewer from './components/StreamViewer';
import './styles/App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleWalletConnect = (address) => {
    setAccount(address);
    setIsConnected(true);
  };

  const handleWalletDisconnect = () => {
    setAccount(null);
    setIsConnected(false);
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo">
            <h1>🏆 SPRX</h1>
            <p>AR/VR Sports Streaming</p>
          </div>
          <WalletConnect 
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
            account={account}
          />
        </header>

        <main className="app-main">
          <Routes>
            <Route 
              path="/" 
              element={
                <EventList 
                  isConnected={isConnected} 
                  account={account} 
                />
              } 
            />
            <Route 
              path="/stream/:eventId" 
              element={
                <StreamViewer 
                  account={account} 
                  isConnected={isConnected}
                />
              } 
            />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Powered by Blockchain Smart Contracts</p>
          {isConnected && account && (
            <p className="wallet-status">
              Connected: {account.substring(0, 6)}...{account.substring(38)}
            </p>
          )}
        </footer>
      </div>
    </Router>
  );
}

export default App;
