import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const RiderApp = () => {
  const [status, setStatus] = useState('Idle');
  
  useEffect(() => {
    // In real app, URL comes from env
    const socket = io('http://localhost:5003');
    socket.emit('join', 'rider_123');
    
    socket.on('rideUpdate', (data) => {
      setStatus(`Ride status updated: ${data.status}`);
    });
    
    socket.on('locationUpdate', (data) => {
      console.log('Driver location:', data);
    });
    
    return () => socket.disconnect();
  }, []);

  const requestRide = async () => {
    setStatus('Requesting ride...');
    // Simulated API call to API Gateway -> Ride Service
    setTimeout(() => {
      setStatus('Ride requested. Waiting for driver...');
    }, 1000);
  };

  return (
    <div style={{ padding: '2rem', border: '2px solid lightblue', borderRadius: '8px' }}>
      <h2>Rider Portal</h2>
      <p>Status: <strong>{status}</strong></p>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Map Placeholder</h3>
        <div style={{ width: '100%', height: '200px', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Interactive Map
        </div>
      </div>
      
      <button 
        onClick={requestRide}
        style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Request Ride
      </button>
    </div>
  );
};

export default RiderApp;
