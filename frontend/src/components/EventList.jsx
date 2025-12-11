import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EventList = ({ isConnected, account }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      if (response.data.success) {
        setEvents(response.data.events);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      setLoading(false);
    }
  };

  const mockEvents = [
    {
      eventId: '1',
      name: 'NBA Finals 2024 - Game 7',
      description: 'Championship game with immersive AR/VR viewing experience',
      startTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      viewers: 1247,
      isLive: true,
      standardPrice: '10',
      vipPrice: '25',
      premiumPrice: '50'
    },
    {
      eventId: '2',
      name: 'Super Bowl LVIII',
      description: 'Experience the big game like never before in virtual reality',
      startTime: Date.now() + 86400000,
      endTime: Date.now() + 90000000,
      viewers: 3521,
      isLive: false,
      standardPrice: '15',
      vipPrice: '35',
      premiumPrice: '75'
    },
    {
      eventId: '3',
      name: 'UEFA Champions League Final',
      description: 'Watch from any angle with AR camera controls',
      startTime: Date.now() + 172800000,
      endTime: Date.now() + 176400000,
      viewers: 892,
      isLive: false,
      standardPrice: '12',
      vipPrice: '30',
      premiumPrice: '60'
    }
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;

  if (loading && events.length === 0) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="event-list">
      <h2>🎮 Live & Upcoming Events</h2>
      
      {!isConnected && (
        <div className="warning-banner">
          ⚠️ Connect your wallet to purchase access passes
        </div>
      )}

      <div className="events-grid">
        {displayEvents.map(event => (
          <div key={event.eventId} className="event-card">
            <div className="event-header">
              <h3>{event.name}</h3>
              {event.isLive && <span className="live-badge">🔴 LIVE</span>}
            </div>
            
            <p className="event-description">{event.description}</p>
            
            <div className="event-stats">
              <div className="stat">
                <span className="stat-label">👥 Viewers</span>
                <span className="stat-value">{event.viewers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">📅 Start</span>
                <span className="stat-value">
                  {new Date(event.startTime).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pricing">
              <div className="price-tier">
                <span className="tier-name">Standard</span>
                <span className="tier-price">{event.standardPrice} SPRX</span>
              </div>
              <div className="price-tier">
                <span className="tier-name">VIP</span>
                <span className="tier-price">{event.vipPrice} SPRX</span>
              </div>
              <div className="price-tier premium">
                <span className="tier-name">Premium AR/VR</span>
                <span className="tier-price">{event.premiumPrice} SPRX</span>
              </div>
            </div>

            <div className="event-actions">
              <Link 
                to={`/stream/${event.eventId}`} 
                className="watch-btn"
              >
                {event.isLive ? '▶️ Watch Now' : '📅 View Details'}
              </Link>
              {isConnected && (
                <button className="purchase-btn">
                  🎫 Purchase Pass
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default EventList;
