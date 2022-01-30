const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ride_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Setup PostGIS table
const setupDatabase = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        rider_id VARCHAR(255) NOT NULL,
        driver_id VARCHAR(255),
        pickup_location geography(POINT) NOT NULL,
        dropoff_location geography(POINT) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        fare DECIMAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL and PostGIS setup completed.');
  } catch (err) {
    console.error('Error setting up database:', err);
  }
};

setupDatabase();

app.get('/health', (req, res) => res.json({ status: 'Ride Service is running' }));

const PORT = process.env.PORT || 5002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ride Service running on port ${PORT}`);
});
