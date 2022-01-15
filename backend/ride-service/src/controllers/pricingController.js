// Dynamic pricing engine

const BASE_FARE = 5.00;
const COST_PER_KM = 1.50;

const calculateFare = (distanceInMeters, currentDemandMultiplier = 1.0) => {
  const distanceInKm = distanceInMeters / 1000;
  let fare = BASE_FARE + (distanceInKm * COST_PER_KM);
  
  // Apply surge pricing
  fare = fare * currentDemandMultiplier;
  
  return parseFloat(fare.toFixed(2));
};

module.exports = { calculateFare };
