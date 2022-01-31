const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => res.json({ status: 'User Service is running' }));

const authRoutes = require('./routes/authRoutes');
app.use('/api/users/auth', authRoutes);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27117/user_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('User Service connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => console.log(`User Service running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
