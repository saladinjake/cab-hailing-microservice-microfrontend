import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

import Auth from './Auth';

const API_BASE = 'http://localhost:5201/api/rides';
const SOCKET_URL = 'http://localhost:5003';

const DriverApp = () => {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('driverUser')) || null);
  const [status, setStatus] = useState(() => sessionStorage.getItem('driverStatus') || 'Available');
  const [location, setLocation] = useState([5.6000, -0.1900]);
  const [rideRequest, setRideRequest] = useState(() => JSON.parse(sessionStorage.getItem('rideRequest')) || null);
  const [activeRide, setActiveRide] = useState(() => JSON.parse(sessionStorage.getItem('activeRide')) || null);
  const [path, setPath] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    if (user) sessionStorage.setItem('driverUser', JSON.stringify(user));
    sessionStorage.setItem('driverStatus', status);
    sessionStorage.setItem('rideRequest', JSON.stringify(rideRequest));
    sessionStorage.setItem('activeRide', JSON.stringify(activeRide));
  }, [user, status, rideRequest, activeRide]);

  useEffect(() => {
    if (!user) return;
    socketRef.current = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    socketRef.current.emit('join', user._id);

    socketRef.current.on('newRideRequest', (data) => {
      // Ignore if already on a trip
      if (status === 'On Trip') return;
      setRideRequest(data);
    });

    return () => socketRef.current.disconnect();
  }, [status, user]);

  // Ping location to DB so nearest-driver query finds us
  useEffect(() => {
    if (!user) return;
    const pingLocation = async (lat, lng) => {
      try {
        await axios.post(`${API_BASE}/driver/location`, { driverId: user._id, lat, lng });
      } catch (err) {
        // ignore network errors silently
      }
    };
    
    // Ping immediately
    pingLocation(location[0], location[1]);

    // Update DB every 5s
    const interval = setInterval(() => {
      pingLocation(location[0], location[1]);
    }, 5000);
    return () => clearInterval(interval);
  }, [location, user]);

  // Simulate GPS movement
  useEffect(() => {
    if (!activeRide?.pickupCoords || !user) return;
    const target = [activeRide.pickupCoords.lat, activeRide.pickupCoords.lng];
    const interval = setInterval(() => {
      setLocation(prev => {
        const newLat = prev[0] + (target[0] - prev[0]) * 0.1;
        const newLng = prev[1] + (target[1] - prev[1]) * 0.1;
        const newLoc = [newLat, newLng];
        
        if (socketRef.current) {
          socketRef.current.emit('driverLocation', { rideId: activeRide.id, lat: newLat, lng: newLng });
        }
        
        setPath(p => [...p, newLoc]);
        return newLoc;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRide, user]);

  const acceptRide = async () => {
    try {
      const res = await axios.patch(`${API_BASE}/${rideRequest.id}/accept`, {
        driverId: user._id
      });
      setActiveRide(res.data);
      setRideRequest(null);
      setStatus('On Trip');
      setPath([location]);
    } catch (err) {
      console.error(err);
      alert('Failed to accept ride');
    }
  };

  const endTrip = async () => {
    try {
      await axios.patch(`${API_BASE}/${activeRide.id}/end`);
      setActiveRide(null);
      setStatus('Available');
      setPath([]);
    } catch (err) {
      console.error(err);
      alert('Failed to end trip');
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    if (socketRef.current) socketRef.current.disconnect();
  };

  if (!user) {
    return <Auth role="driver" onLogin={(u) => setUser(u)} />;
  }

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🚗 Driver Portal - {user.name}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {status === 'On Trip' && (
            <button onClick={endTrip} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              End Trip
            </button>
          )}
          <div style={{ background: status === 'Available' ? '#f6ffed' : '#fff7e6', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid currentColor' }}>
            Status: <strong>{status}</strong>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ height: '400px', width: '100%', margin: '1rem 0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={location}><Popup>My Location</Popup></Marker>
          
          {rideRequest?.pickupCoords && (
            <Marker position={[rideRequest.pickupCoords.lat, rideRequest.pickupCoords.lng]}>
              <Popup>📍 Requesting Rider</Popup>
            </Marker>
          )}

          {activeRide?.pickupCoords && (
            <Marker position={[activeRide.pickupCoords.lat, activeRide.pickupCoords.lng]}>
              <Popup>📍 Pickup Rider here</Popup>
            </Marker>
          )}
          
          {activeRide?.dropoffCoords && (
            <Marker position={[activeRide.dropoffCoords.lat, activeRide.dropoffCoords.lng]} icon={dropoffIcon}>
              <Popup>🏁 Rider Dropoff</Popup>
            </Marker>
          )}

          {path.length > 0 && <Polyline positions={path} color="green" />}
        </MapContainer>
      </div>

      {rideRequest && (
        <div style={{ padding: '1.5rem', background: '#fffbe6', borderRadius: '12px', border: '1px solid #ffe58f', animation: 'pulse 2s infinite' }}>
          <h3>🔔 New Ride Requested!</h3>
          <p>Distance: <strong>~1.2 km</strong></p>
          <button onClick={acceptRide} style={{ width: '100%', padding: '1rem', background: '#52c41a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Accept Ride
          </button>
        </div>
      )}

      {activeRide && (
        <div style={{ padding: '1rem', background: '#f0f2f5', borderRadius: '8px' }}>
          <strong>Active Trip:</strong> {activeRide.id} | Navigating to Rider...
        </div>
      )}
    </div>
  );
};

export default DriverApp;
