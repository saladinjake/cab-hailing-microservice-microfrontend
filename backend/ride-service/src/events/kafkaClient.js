const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ride-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9192'],
  retry: { retries: 20, initialRetryTime: 3000 },
});

const producer = kafka.producer();

const connectProducer = async (retries = 0) => {
  try {
    await producer.connect();
    console.log('Connected to Kafka producer');
  } catch (error) {
    const wait = Math.min(5000 * (retries + 1), 30000);
    console.error(`Kafka producer connect failed (attempt ${retries + 1}), retrying in ${wait / 1000}s...`);
    setTimeout(() => connectProducer(retries + 1), wait);
  }
};

const sendRideEvent = async (topic, eventPayload) => {
  try {
    await producer.send({ topic, messages: [{ value: JSON.stringify(eventPayload) }] });
  } catch (error) {
    console.error(`Failed to send Kafka event on topic ${topic}:`, error.message);
  }
};

module.exports = { connectProducer, sendRideEvent };
