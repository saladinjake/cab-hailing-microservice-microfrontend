import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const DriverApp = () => {
  const [status, setStatus] = useState('Available');
  const [rideRequest, setRideRequest] = useState(null);
  
  useEffect(() => {
    // In real app, URL comes from env
    const socket = io('http://localhost:5003');
    socket.emit('join', 'driver_456'); // Simulated driver ID
    
    socket.on('newRideRequest', (data) => {
      setRideRequest(data);
    });
    
    return () => socket.disconnect();
  }, []);

  const acceptRide = () => {
    setStatus('On Trip');
    setRideRequest(null);
    // Simulate accepting ride via API
  };

  return (
    <div style={{ padding: '2rem', border: '2px solid lightgreen', borderRadius: '8px' }}>
      <h2>Driver Portal</h2>
      <p>Status: <strong>{status}</strong></p>
      
      {rideRequest && (
        <div style={{ padding: '1rem', background: '#fffbe6', border: '1px solid #ffe58f', marginTop: '1rem' }}>
          <h4>New Ride Request!</h4>
          <p>Pickup: {rideRequest.pickup}</p>
          <button 
            onClick={acceptRide}
            style={{ padding: '8px 16px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Accept Ride
          </button>
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <h3>Navigation Placeholder</h3>
        <div style={{ width: '100%', height: '200px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          GPS Map
        </div>
      </div>
    </div>
  );
};

export default DriverApp;
