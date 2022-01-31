const express = require('express');
const { requestRide, acceptRide, endTrip, getRideStatus } = require('../controllers/rideController');
const { updateLocation } = require('../controllers/driverController');

const router = express.Router();

router.post('/request', requestRide);
router.patch('/:id/accept', acceptRide);
router.patch('/:id/end', endTrip);
router.get('/:id', getRideStatus);
router.post('/driver/location', updateLocation);

module.exports = router;
