import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = 'http://localhost:5201/api/rides';
const SOCKET_URL = 'http://localhost:5003';

const DriverApp = () => {
  const [status, setStatus] = useState('Available');
  const [location, setLocation] = useState([5.6000, -0.1900]); // Default Accra
  const [rideRequest, setRideRequest] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [path, setPath] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join', 'driver_456');

    socketRef.current.on('newRideRequest', (data) => {
      setRideRequest(data);
    });

    return () => socketRef.current.disconnect();
  }, []);

  // Simulate GPS movement when active
  useEffect(() => {
    if (!activeRide?.pickupCoords) return;
    const target = [activeRide.pickupCoords.lat, activeRide.pickupCoords.lng];
    const interval = setInterval(() => {
      setLocation(prev => {
        const newLat = prev[0] + (target[0] - prev[0]) * 0.1;
        const newLng = prev[1] + (target[1] - prev[1]) * 0.1;
        const newLoc = [newLat, newLng];
        socketRef.current.emit('driverLocation', { rideId: activeRide.id, lat: newLat, lng: newLng });
        setPath(p => [...p, newLoc]);
        return newLoc;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRide]);

  const acceptRide = async () => {
    try {
      const res = await axios.patch(`${API_BASE}/${rideRequest.id}/accept`, {
        driverId: 'driver_456'
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

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Driver Portal</h2>
        <div style={{ background: status === 'Available' ? '#f6ffed' : '#fff7e6', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid currentColor' }}>
          Status: <strong>{status}</strong>
        </div>
      </header>

      <div style={{ height: '400px', width: '100%', margin: '1rem 0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={location}><Popup>My Location</Popup></Marker>
          {activeRide?.pickupCoords && (
            <Marker position={[activeRide.pickupCoords.lat, activeRide.pickupCoords.lng]}>
              <Popup>📍 Pickup Rider here</Popup>
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
