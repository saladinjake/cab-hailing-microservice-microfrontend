const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { registerTrackingHandlers } = require('./sockets/trackingHandler');

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (req, res) => res.json({ status: 'Notification Service is running' }));

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Rider/Driver joins their own specific room to receive private notifications
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });

  // Ride location updates
  socket.on('updateLocation', (data) => {
    const { rideId, location } = data;
    io.to(rideId).emit('locationUpdate', location);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Register real-time location tracking handlers
  registerTrackingHandlers(io, socket);
});

const PORT = process.env.PORT || 5003;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Notification Service running on port ${PORT}`);
});
