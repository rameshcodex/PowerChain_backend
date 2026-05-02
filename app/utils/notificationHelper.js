const Notification = require("../models/notification");
const { getIO } = require("../controllers/Ticket/socket/TicketMessSocket");
const { logger } = require("../../winston");


exports.sendNotification = async ({
    userId,
    type,
    event,
    title,
    message,
    referenceId,
}) => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            event,
            title,
            message,
            referenceId: referenceId || null,
        });

        const unreadCount = await Notification.countDocuments({
            user: userId,
            isRead: false,
        });

        const io = getIO();
        const roomName = `user_${userId.toString()}`;

        logger.info(`Sending notification to user ${userId}: ${title} - ${message}`);

        // Emit to a specific user room. 
        // Note: Ensure your socket connection logic handles socket.join(`user_${userId}`)
        io.to(roomName).emit("notification", notification);
        console.log(`Emitted notification to ${roomName}:`, notification);
        io.to(roomName).emit("notificationCount", {
            unreadCount,
        });
        console.log(`Emitted notificationCount to ${roomName}:`, unreadCount);

        return notification;
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};
