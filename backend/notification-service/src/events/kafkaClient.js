const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const connectConsumer = async (io) => {
  try {
    await consumer.connect();
    console.log('Connected to Kafka consumer');
    
    await consumer.subscribe({ topic: 'ride-events', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log(`Received event: ${event.type}`);
        
        // Broadcast to relevant rooms/users via Socket.io
        if (event.type === 'RIDE_REQUESTED') {
          io.emit('newRideRequest', event.payload);
        } else if (event.type === 'RIDE_ACCEPTED' || event.type === 'RIDE_UPDATED') {
          io.to(event.payload.rideId).emit('rideUpdate', event.payload);
        }
      },
    });
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

module.exports = { connectConsumer };
