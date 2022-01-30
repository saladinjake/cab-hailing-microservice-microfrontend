const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// Proxy rules
app.use('/api/users', createProxyMiddleware({ target: process.env.USER_SERVICE_URL || 'http://localhost:5001', changeOrigin: true }));
app.use('/api/rides', createProxyMiddleware({ target: process.env.RIDE_SERVICE_URL || 'http://localhost:5002', changeOrigin: true }));
app.use('/api/notifications', createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5003', changeOrigin: true }));

const PORT = process.env.PORT || 5201;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
