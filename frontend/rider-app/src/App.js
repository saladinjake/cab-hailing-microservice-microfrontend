import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import useTracking from './useTracking';

const RiderApp = () => {
  const [status, setStatus] = useState('Idle');
  const [activeRideId, setActiveRideId] = useState(null);
  const { driverLocation, rideStatus } = useTracking(activeRideId);
  
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
    const newRideId = `ride_${Date.now()}`;
    setTimeout(() => {
      setActiveRideId(newRideId);
      setStatus('Ride requested. Waiting for driver...');
    }, 1000);
  };

  return (
    <div style={{ padding: '2rem', border: '2px solid lightblue', borderRadius: '8px' }}>
      <h2>Rider Portal</h2>
      <p>Status: <strong>{status}</strong></p>
      {activeRideId && (
        <div style={{ margin: '10px 0', padding: '10px', background: '#e6f7ff', borderRadius: '4px' }}>
          <p><strong>Ride Status:</strong> {rideStatus}</p>
          {driverLocation
            ? <p><strong>Driver Location:</strong> Lat {driverLocation.lat.toFixed(4)}, Lng {driverLocation.lng.toFixed(4)}</p>
            : <p>Waiting for driver location...</p>
          }
        </div>
      )}
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
