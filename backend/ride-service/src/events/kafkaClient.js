const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ride-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Connected to Kafka producer');
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

const sendRideEvent = async (topic, eventPayload) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(eventPayload) }],
    });
  } catch (error) {
    console.error(`Error sending message to topic ${topic}:`, error);
  }
};

module.exports = { connectProducer, sendRideEvent };
