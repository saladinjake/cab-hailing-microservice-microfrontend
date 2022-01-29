/**
 * trackingHandler.js
 * Registers Socket.io events for real-time location tracking.
 * Riders subscribe to a rideId room; drivers emit location updates.
 */
const registerTrackingHandlers = (io, socket) => {
  // Rider: subscribe to a specific ride's location feed
  socket.on('subscribeToRide', (rideId) => {
    socket.join(`ride:${rideId}`);
    console.log(`Socket ${socket.id} subscribed to ride: ${rideId}`);
  });

  // Driver: broadcast location to all subscribers of the ride
  socket.on('driverLocation', ({ rideId, lat, lng }) => {
    io.to(`ride:${rideId}`).emit('locationUpdate', { lat, lng, ts: Date.now() });
  });

  // Emit status changes (DRIVER_ARRIVING, ON_TRIP, COMPLETED)
  socket.on('rideStatusChange', ({ rideId, status }) => {
    io.to(`ride:${rideId}`).emit('rideStatusUpdate', { status, ts: Date.now() });
    console.log(`Ride ${rideId} status -> ${status}`);
  });
};

module.exports = { registerTrackingHandlers };
