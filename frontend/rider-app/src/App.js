import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = 'http://localhost:5201/api/rides';
const SOCKET_URL = 'http://localhost:5003';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const driverIcon = new L.DivIcon({
  className: 'custom-driver-icon',
  html: "<div style='font-size: 32px; line-height: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);'>🚗</div>",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function LocationSearch({ label, onSelect, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(NOMINATIM, {
          params: { q, format: 'json', limit: 6, addressdetails: 1 },
          headers: { 'Accept-Language': 'en' },
        });
        setResults(res.data);
      } catch (_) {}
      finally { setLoading(false); }
    }, 400);
  }, []);

  const handleSelect = (place) => {
    setSelected(place.display_name);
    setQuery(place.display_name);
    setResults([]);
    onSelect({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name });
  };

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#444' }}>{label}</label>
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
        placeholder={`Search ${label.toLowerCase()}...`}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: '8px',
          border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none',
          boxSizing: 'border-box', background: disabled ? '#f5f5f5' : 'white',
        }}
      />
      {loading && <div style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: '#888' }}>Searching…</div>}
      {results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid #d1d5db', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', margin: 0, padding: 0,
          listStyle: 'none', maxHeight: '220px', overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                borderBottom: i < results.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              📍 {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 13, { duration: 1.2 }); }, [center, map]);
  return null;
}

const RiderApp = () => {
  const [pickup, setPickup] = useState(() => JSON.parse(sessionStorage.getItem('pickup')) || null);
  const [dropoff, setDropoff] = useState(() => JSON.parse(sessionStorage.getItem('dropoff')) || null);
  const [status, setStatus] = useState(() => sessionStorage.getItem('riderStatus') || 'Select pickup and dropoff to begin');
  const [ride, setRide] = useState(() => JSON.parse(sessionStorage.getItem('ride')) || null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [path, setPath] = useState([]);
  const socketRef = useRef();
  const mapCenter = pickup ? [pickup.lat, pickup.lng] : [20, 0];

  useEffect(() => {
    sessionStorage.setItem('pickup', JSON.stringify(pickup));
    sessionStorage.setItem('dropoff', JSON.stringify(dropoff));
    sessionStorage.setItem('riderStatus', status);
    sessionStorage.setItem('ride', JSON.stringify(ride));
  }, [pickup, dropoff, status, ride]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    
    if (ride?.id) {
      socketRef.current.emit('subscribeToRide', ride.id);
    }

    socketRef.current.on('rideUpdate', (data) => {
      if (data.status === 'COMPLETED') {
        setStatus('Ride Completed');
        alert('Your trip has ended!');
        setRide(null);
        setPickup(null);
        setDropoff(null);
        setDriverLocation(null);
        setPath([]);
      } else {
        setRide(prev => ({ ...prev, ...data }));
        if (data.status) setStatus(`Ride ${data.status}`);
      }
    });

    socketRef.current.on('locationUpdate', (location) => {
      setDriverLocation(location);
      setPath(prev => [...prev, [location.lat, location.lng]]);
    });

    return () => socketRef.current.disconnect();
  }, [ride?.id]);

  const requestRide = async () => {
    if (!pickup || !dropoff) { alert('Please select both pickup and dropoff locations.'); return; }
    try {
      setStatus('Requesting...');
      const res = await axios.post(`${API_BASE}/request`, {
        riderId: 'rider_123',
        pickup: { lat: pickup.lat, lng: pickup.lng },
        dropoff: { lat: dropoff.lat, lng: dropoff.lng },
      });
      setRide(res.data);
      setStatus('Ride requested — waiting for driver...');
    } catch (err) {
      console.error(err);
      setStatus('Error requesting ride. Is the backend running?');
    }
  };

  const calculateETA = () => {
    if (!driverLocation || !pickup) return null;
    const R = 6371;
    const dLat = ((pickup.lat - driverLocation.lat) * Math.PI) / 180;
    const dLng = ((pickup.lng - driverLocation.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((driverLocation.lat * Math.PI) / 180) * Math.cos((pickup.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const mins = Math.round((dist / 30) * 60);
    return mins <= 1 ? 'Arriving now' : `${mins} mins`;
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f7f8fa', minHeight: '100vh', padding: '0' }}>
      <div style={{ background: '#1a1a2e', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🚗 Rider Portal</h2>
        <span style={{
          background: ride ? '#28a745' : '#ffc107', color: ride ? 'white' : '#333',
          padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600'
        }}>{status}</span>
      </div>

      {!ride && (
        <div style={{ padding: '1rem 1.5rem', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <LocationSearch label="Pickup Location" onSelect={setPickup} disabled={!!ride} />
          <LocationSearch label="Dropoff Location" onSelect={setDropoff} disabled={!!ride} />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={requestRide}
              disabled={!pickup || !dropoff}
              style={{
                padding: '10px 24px', background: pickup && dropoff ? '#1a1a2e' : '#ccc',
                color: 'white', border: 'none', borderRadius: '8px', cursor: pickup && dropoff ? 'pointer' : 'not-allowed',
                fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap',
              }}
            >
              Request Ride →
            </button>
          </div>
        </div>
      )}

      {pickup && (
        <div style={{ padding: '0.5rem 1.5rem', background: '#f0f2ff', fontSize: '13px', color: '#444' }}>
          {pickup && <span>📍 <strong>From:</strong> {pickup.name}</span>}
          {dropoff && <span style={{ marginLeft: '2rem' }}>🏁 <strong>To:</strong> {dropoff.name}</span>}
        </div>
      )}

      <div style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
        <MapContainer center={mapCenter} zoom={pickup ? 13 : 2} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {pickup && <MapRecenter center={[pickup.lat, pickup.lng]} />}
          {pickup && <Marker position={[pickup.lat, pickup.lng]}><Popup>📍 Pickup: {pickup.name || 'Selected Location'}</Popup></Marker>}
          {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}><Popup>🏁 Dropoff: {dropoff.name || 'Selected Location'}</Popup></Marker>}
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Popup>🚘 Driver — ETA: {calculateETA()}</Popup>
            </Marker>
          )}
          {path.length > 1 && <Polyline positions={path} color="#1a73e8" weight={4} dashArray="6 4" />}
        </MapContainer>
      </div>

      {ride && (
        <div style={{ padding: '1rem 1.5rem', background: 'white', borderTop: '2px solid #e0e7ff', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <span>🔖 <strong>Ride #:</strong> {ride.id}</span>
          <span>🚘 <strong>Driver:</strong> {ride.driver_id || 'Searching...'}</span>
          <span>⏱ <strong>ETA:</strong> {calculateETA() || 'Calculating...'}</span>
          <span>📊 <strong>Status:</strong> {ride.status}</span>
        </div>
      )}
    </div>
  );
};

export default RiderApp;
