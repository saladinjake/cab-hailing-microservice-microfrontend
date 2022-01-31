const { Pool } = require('pg');
const { sendRideEvent } = require('../events/kafkaClient');
const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ride_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5431,
});

const requestRide = async (req, res) => {
  const { riderId, pickup, dropoff } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO rides (rider_id, pickup_location, dropoff_location, status) 
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), ST_SetSRID(ST_MakePoint($4, $5), 4326), 'PENDING') 
       RETURNING *`,
      [riderId, pickup.lng, pickup.lat, dropoff.lng, dropoff.lat]
    );
    const ride = {
      ...result.rows[0],
      pickupCoords: { lat: pickup.lat, lng: pickup.lng },
      dropoffCoords: { lat: dropoff.lat, lng: dropoff.lng },
    };
    await sendRideEvent('ride-events', { type: 'RIDE_REQUESTED', payload: ride });
    res.status(201).json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request ride' });
  }
};

const acceptRide = async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rides SET driver_id = $1, status = 'ACCEPTED' WHERE id = $2 RETURNING *`,
      [driverId, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Ride not found' });
    const ride = result.rows[0];
    await sendRideEvent('ride-events', { type: 'RIDE_ACCEPTED', payload: { ...ride, rideId: id, driverId } });
    res.json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
};

const getRideStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM rides WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Ride not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
};

module.exports = { requestRide, acceptRide, getRideStatus };
