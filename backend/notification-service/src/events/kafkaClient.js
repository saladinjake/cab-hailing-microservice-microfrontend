const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9192'],
  retry: { retries: 20, initialRetryTime: 3000 },
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const connectConsumer = async (io) => {
  const attempt = async (retries = 0) => {
    try {
      await consumer.connect();
      console.log('Connected to Kafka consumer');
      await consumer.subscribe({ topic: 'ride-events', fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ message }) => {
          const event = JSON.parse(message.value.toString());
          console.log(`Kafka event received: ${event.type}`);
          if (event.type === 'RIDE_REQUESTED') {
            io.emit('newRideRequest', event.payload);
          } else if (event.type === 'RIDE_ACCEPTED' || event.type === 'RIDE_UPDATED' || event.type === 'RIDE_COMPLETED') {
            io.to(`ride:${event.payload.rideId}`).emit('rideUpdate', event.payload);
          }
        },
      });
    } catch (error) {
      const wait = Math.min(5000 * (retries + 1), 30000);
      console.error(`Kafka connect failed (attempt ${retries + 1}), retrying in ${wait / 1000}s...`);
      setTimeout(() => attempt(retries + 1), wait);
    }
  };
  attempt();
};

module.exports = { connectConsumer };
