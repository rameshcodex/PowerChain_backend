const amqp = require('amqplib');
const Notification = require('../models/notification');
const { getIO } = require('../controllers/Ticket/socket/TicketMessSocket');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://lucky:123456@localhost:5672';
const NOTIFICATION_QUEUE = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification_queue';


var channel = null



async function connectToRabbitMQ() {
    try {
        console.log("Connecting to RabbitMQ...");

        const connection = await amqp.connect(RABBITMQ_URL);

        console.log("✅ RabbitMQ connected");

        connection.on("error", (err) => {
            console.error("❌ RabbitMQ connection error:", err.message);
        });

        connection.on("close", () => {
            console.error("❌ RabbitMQ connection closed");
        });

        channel = await connection.createChannel();

        console.log("✅ RabbitMQ channel created");

        await channel.assertQueue(NOTIFICATION_QUEUE, {
            durable: true,
        });

        console.log(`✅ Queue '${NOTIFICATION_QUEUE}' asserted`);

    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error.message);
    }
}

async function closeRabbitMQConnection() {
    if (channel) {
        await channel.close();
    }
}

async function getChannel() {
    if (!channel) {
        await connectToRabbitMQ();
    }
    return channel;
}

module.exports = {
    getChannel,
    closeRabbitMQConnection,
    connectToRabbitMQ
};
