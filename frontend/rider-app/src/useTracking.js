import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const NOTIFICATION_URL = 'http://localhost:5003';

const useTracking = (rideId) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState('PENDING');

  useEffect(() => {
    if (!rideId) return;

    const socket = io(NOTIFICATION_URL);

    socket.on('connect', () => {
      socket.emit('subscribeToRide', rideId);
    });

    socket.on('locationUpdate', ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    socket.on('rideStatusUpdate', ({ status }) => {
      setRideStatus(status);
    });

    return () => {
      socket.disconnect();
    };
  }, [rideId]);

  return { driverLocation, rideStatus };
};

export default useTracking;
