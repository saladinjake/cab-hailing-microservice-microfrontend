const express = require('express');
const { requestRide, acceptRide, getRideStatus } = require('../controllers/rideController');

const router = express.Router();

router.post('/request', requestRide);
router.patch('/:id/accept', acceptRide);
router.get('/:id', getRideStatus);

module.exports = router;
