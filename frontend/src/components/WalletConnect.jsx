import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnect = ({ onConnect, onDisconnect, account }) => {
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask to use this application');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        onConnect(accounts[0]);
        setError('');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    onDisconnect();
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          onConnect(accounts[0]);
        } else {
          onDisconnect();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [onConnect, onDisconnect]);

  return (
    <div className="wallet-connect">
      {!account ? (
        <button onClick={connectWallet} className="connect-btn">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <span className="wallet-address">
            {account.substring(0, 6)}...{account.substring(38)}
          </span>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default WalletConnect;
