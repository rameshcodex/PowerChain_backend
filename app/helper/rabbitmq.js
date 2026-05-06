const amqp = require('amqplib');
const Notification = require('../models/notification');
const { getIO } = require('../controllers/Ticket/socket/TicketMessSocket');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://lucky:123456@localhost:5672';
const NOTIFICATION_QUEUE = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification_queue';

async function publishNotificationEvent(message, queueName = NOTIFICATION_QUEUE) {
    let connection;

    try {
        connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(queueName, {
            durable: true
        });

        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
            persistent: true,
            contentType: 'application/json'
        });

        console.log('Notification event published');
        await channel.close();
        return true;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function publishLoginNotification({
    userId,
    username,
    email,
    deviceName,
    deviceIPAddress,
}) {
    const loginDeviceName = deviceName || 'Unknown device';
    const loginDeviceIPAddress = deviceIPAddress || 'Unknown IP';

    return publishNotificationEvent({
        userId: userId.toString(),
        type: 'user',
        event: 'login_success',
        category: 'SECURITY',
        eventType: 'LOGIN_SUCCssssssssssssssESS',
        title: 'Login Alert',
        message: `Your account was logged in successfully from ${loginDeviceName}. IP address: ${loginDeviceIPAddress}`,
        referenceId: userId.toString(),
        priority: 'MEDIUM',
        data: {
            username,
            email,
            deviceName: loginDeviceName,
            deviceIPAddress: loginDeviceIPAddress,
            loggedInAt: new Date().toISOString()
        }
    });
}

function buildNotificationDocument(event) {
    const userId = event.user || event.userId;

    return {
        user: userId,
        userId: userId?.toString(),
        type: event.type || 'user',
        event: event.event || 'login_success',
        category: event.category || 'SECURITY',
        eventType: event.eventType || 'LOGIN_SUCCESS',
        title: event.title,
        message: event.message,
        referenceId: event.referenceId || userId || null,
        priority: event.priority || 'MEDIUM',
        action: event.action || { type: 'NONE' },
        data: event.data,
        deliveries: event.deliveries || [],
        expiresAt: event.expiresAt || null
    };
}

async function startNotificationConsumer(queueName = NOTIFICATION_QUEUE) {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(queueName, {
        durable: true
    });

    channel.prefetch(1);

    channel.consume(queueName, async (msg) => {
        if (!msg) {
            return;
        }

        try {
            const payload = JSON.parse(msg.content.toString());
            const notification = await Notification.create(buildNotificationDocument(payload));
            const notificationUserId = notification.user || notification.userId;
            const unreadCount = await Notification.countDocuments({
                $or: [
                    { user: notificationUserId },
                    { userId: notificationUserId.toString() },
                ],
                isRead: false
            });
            const roomName = `user_${notificationUserId.toString()}`;

            try {
                const io = getIO();
                io.to(roomName).emit('notification', notification);
                io.to(roomName).emit('notificationCount', { unreadCount });
            } catch (socketError) {
                console.error('RabbitMQ notification saved but socket emit failed:', socketError.message);
            }

            console.log('RabbitMQ notification stored in DB:', notification._id.toString());
            channel.ack(msg);
        } catch (error) {
            console.error('Failed to store RabbitMQ notification:', error.message);
            channel.nack(msg, false, false);
        }
    });

    connection.on('close', () => {
        console.error('RabbitMQ notification consumer connection closed');
    });

    connection.on('error', (error) => {
        console.error('RabbitMQ notification consumer error:', error.message);
    });

    console.log(`RabbitMQ notification consumer started on queue: ${queueName}`);
    return { connection, channel };
}

module.exports = {
    publishNotificationEvent,
    publishLoginNotification,
    startNotificationConsumer
};
