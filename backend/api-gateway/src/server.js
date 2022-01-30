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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

const proxy = (target, prefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { '^': prefix },
  });

app.use('/api/users', proxy(process.env.USER_SERVICE_URL || 'http://localhost:5001', '/api/users'));
app.use('/api/rides', proxy(process.env.RIDE_SERVICE_URL || 'http://localhost:5002', '/api/rides'));
app.use('/api/notifications', proxy(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5003', '/api/notifications'));

const PORT = process.env.PORT || 5201;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
