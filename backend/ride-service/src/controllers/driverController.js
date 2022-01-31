const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ride_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5431,
});

const updateLocation = async (req, res) => {
  const { driverId, lat, lng } = req.body;
  if (!driverId || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing driverId, lat, or lng' });
  }

  try {
    await pool.query(
      `INSERT INTO active_drivers (driver_id, location, last_updated) 
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), CURRENT_TIMESTAMP)
       ON CONFLICT (driver_id) 
       DO UPDATE SET location = EXCLUDED.location, last_updated = CURRENT_TIMESTAMP`,
      [driverId, lng, lat]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error updating driver location:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { updateLocation };
