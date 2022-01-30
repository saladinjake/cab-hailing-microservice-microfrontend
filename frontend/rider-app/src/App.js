import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
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

const RiderApp = () => {
  const [pickup, setPickup] = useState([5.6037, -0.1870]); // Default Accra
  const [dropoff, setDropoff] = useState([5.6147, -0.1770]);
  const [status, setStatus] = useState('Idle');
  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [path, setPath] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join', 'rider_123');

    socketRef.current.on('rideUpdate', (data) => {
      setRide(prev => ({ ...prev, ...data }));
      setStatus(`Ride ${data.status}`);
    });

    socketRef.current.on('locationUpdate', (location) => {
      setDriverLocation(location);
      setPath(prev => [...prev, [location.lat, location.lng]]);
    });

    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    if (ride?.id) {
      socketRef.current.emit('subscribeToRide', ride.id);
    }
  }, [ride?.id]);

  const requestRide = async () => {
    try {
      setStatus('Requesting...');
      const res = await axios.post(`${API_BASE}/request`, {
        riderId: 'rider_123',
        pickup: { lat: pickup[0], lng: pickup[1] },
        dropoff: { lat: dropoff[0], lng: dropoff[1] }
      });
      setRide(res.data);
      setStatus('Waiting for driver...');
    } catch (err) {
      console.error(err);
      setStatus('Error requesting ride');
    }
  };

  const calculateETA = () => {
    if (!driverLocation || !pickup) return null;
    const dist = Math.sqrt(Math.pow(driverLocation.lat - pickup[0], 2) + Math.pow(driverLocation.lng - pickup[1], 2)) * 111;
    const mins = Math.round(dist / 0.5); // 30km/h
    return mins > 0 ? `${mins} mins` : 'Arriving...';
  };

  function MapEvents() {
    useMapEvents({
      click(e) {
        if (!ride) setPickup([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Rider Portal</h2>
        <div style={{ background: '#f0f2f5', padding: '0.5rem 1rem', borderRadius: '20px' }}>
          Status: <strong>{status}</strong>
        </div>
      </header>

      <div style={{ height: '400px', width: '100%', margin: '1rem 0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <MapContainer center={pickup} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
          <Marker position={pickup}><Popup>Pickup Point</Popup></Marker>
          <Marker position={dropoff}><Popup>Dropoff Point</Popup></Marker>
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]}>
              <Popup>Driver (ETA: {calculateETA()})</Popup>
            </Marker>
          )}
          {path.length > 0 && <Polyline positions={path} color="blue" />}
        </MapContainer>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {!ride && (
          <button onClick={requestRide} style={{ flex: 1, padding: '1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Request Ride
          </button>
        )}
        {ride && (
          <div style={{ flex: 1, padding: '1rem', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
            <strong>Ride ID:</strong> {ride.id} | <strong>Driver:</strong> {ride.driver_id || 'Searching...'} | <strong>ETA:</strong> {calculateETA() || 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderApp;
