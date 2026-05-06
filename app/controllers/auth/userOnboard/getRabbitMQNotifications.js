const Notification = require("../../../models/notification");

const getUserNotificationFilter = (userId) => ({
    $or: [
        { user: userId },
        { userId: userId.toString() },
    ],
});

const normalizeNotificationForClient = (notification) => {
    const normalized = { ...notification };

    if (!normalized.user && normalized.userId) {
        normalized.user = normalized.userId;
    }

    if (!normalized.type && normalized.category === "SECURITY") {
        normalized.type = "user";
    }

    if (!normalized.event && normalized.eventType === "LOGIN_SUCCESS") {
        normalized.event = "login_success";
    }

    if (!normalized.referenceId) {
        normalized.referenceId = normalized.userId || normalized.user?.toString?.() || null;
    }

    return normalized;
};

const getRabbitMQNotifications = async (req, res) => {
    try {
        // Fetch notifications for the user
        const notifications = await Notification
            .find(getUserNotificationFilter(req.user._id))
            .sort({ createdAt: -1 })
            .lean();
        const unreadCount = await Notification.countDocuments({
            ...getUserNotificationFilter(req.user._id),
            isRead: false,
        });
        const normalizedNotifications = notifications.map(normalizeNotificationForClient);

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: normalizedNotifications,
            result: { notifications: normalizedNotifications, unreadCount },
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
};

module.exports = { getRabbitMQNotifications };
