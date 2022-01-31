// Mock matching engine using basic geospatial query simulation
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ride_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const findNearestDriver = async (pickupLon, pickupLat) => {
  const query = `
    SELECT driver_id, ST_Distance(location, ST_MakePoint($1, $2)::geography) as distance
    FROM active_drivers
    WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, 5000)
    ORDER BY distance ASC LIMIT 1;
  `;
  const result = await pool.query(query, [pickupLon, pickupLat]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

module.exports = { findNearestDriver };
