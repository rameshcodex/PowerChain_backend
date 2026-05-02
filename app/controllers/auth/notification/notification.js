const mongoose = require("mongoose");
const Notification = require("../../../models/notification");
const P2POrder = require("../../../models/p2pOrder");
// const SpotOrder = require("../../../models/spotOrder");
// const SupportTicket = require("../../../models/supportTicket");

// exports.getNotifications = async (req, res) => {
//     try {
//         const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
//         res.json(notifications);
//     } catch (error) {
//         console.error("Error fetching notifications:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

exports.getNotifications = async (req, res) => {
    try {
        const { status } = req.query;

        let filter = { user: req.user._id };

        // Apply read/unread filter
        if (status === "read") {
            filter.isRead = true;
        } else if (status === "unread") {
            filter.isRead = false;
        }

        const notifications = await Notification
            .find(filter)
            .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });


        res.json({
            success: true,
            result: {notifications, unreadCount}
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};




//MAKE AS READ WITH PARAMS
// exports.markAsRead = async (req, res) => {
//     try {
//         const { type, id } = req.query;

//         if (!type) {
//             return res.status(400).json({
//                 message: "Type is required (single, selected, all)"
//             });
//         }

//         // Mark Single
//         if (type === "single") {


//             if (!id) {
//                 return res.status(400).json({
//                     message: "Notification ID is required"
//                 });
//             }

//             const notification = await Notification.findOneAndUpdate(
//                 { _id: id, user: req.user._id },
//                 { isRead: true },
//                 { new: true }
//             );

//             if (!notification) {
//                 return res.status(404).json({
//                     message: "Notification not found"
//                 });
//             }

//             return res.json({
//                 success: true,
//                 message: "Notification marked as read",
//                 result: notification
//             });
//         }

//         //  Mark Selected (multiple IDs in id param)
//         if (type === "selected") {
//             if (!id) {
//                 return res.status(400).json({
//                     message: "Notification IDs are required"
//                 });
//             }

//             const idArray = id.split(",");

//             await Notification.updateMany(
//                 {
//                     _id: { $in: idArray },
//                     user: req.user._id
//                 },
//                 { isRead: true }
//             );

//             return res.json({
//                 success: true,
//                 message: "Selected notifications marked as read"
//             });
//         }

//         //  Mark All
//         if (type === "all") {
//             await Notification.updateMany(
//                 { user: req.user._id, isRead: false },
//                 { isRead: true }
//             );

//             return res.json({
//                 success: true,
//                 message: "All notifications marked as read"
//             });
//         }

//         return res.status(400).json({
//             message: "Invalid type value"
//         });

//     } catch (error) {
//         console.error("Error marking notification(s) as read:", error);
//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };


exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.query;

        // 🔹 CASE 1: No ID → Mark ALL
        if (!id) {
            await Notification.updateMany(
                { user: req.user._id, isRead: false },
                { isRead: true }
            );

            return res.json({
                success: true,
                message: "All notifications marked as read"
            });
        }

        // 🔹 Split IDs
        const idArray = id.split(",");

        // 🔹 CASE 2: Single ID
        if (idArray.length === 1) {
            const singleId = idArray[0];

            if (!mongoose.Types.ObjectId.isValid(singleId)) {
                return res.status(400).json({ message: "Invalid notification id" });
            }

            const notification = await Notification.findOneAndUpdate(
                { _id: singleId, user: req.user._id },
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }

            return res.json({
                success: true,
                message: "Notification marked as read",
                result: notification
            });
        }

        // 🔹 CASE 3: Multiple IDs (Selected)
        const validIds = idArray
            .filter(mongoose.Types.ObjectId.isValid)
            .map((i) => new mongoose.Types.ObjectId(i));

        if (!validIds.length) {
            return res.status(400).json({ message: "No valid IDs provided" });
        }

        await Notification.updateMany(
            { _id: { $in: validIds }, user: req.user._id },
            { isRead: true }
        );

        return res.json({
            success: true,
            message: "Selected notifications marked as read"
        });

    } catch (error) {
        console.error("Error marking notification(s) as read:", error);
        res.status(500).json({ message: "Server error" });
    }
};




// exports.markAsRead = async (req, res) => {
//     try {
//         const notificationId = req.params.id;
//         const notification = await Notification.findOneAndUpdate(
//             { _id: notificationId, user: req.user._id },
//             { isRead: true },
//             { new: true }
//         );
//         if (!notification) {
//             return res.status(404).json({ message: "Notification not found" });
//         }
//         res.json(notification);
//     } catch (error) {
//         console.error("Error marking notification as read:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };
// mark all notifications as read
// exports.markAllAsRead = async (req, res) => {
//     try {
//         await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
//         res.json({ message: "All notifications marked as read" });
//     } catch (error) {
//         console.error("Error marking all notifications as read:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findOneAndDelete({ _id: notificationId, user: req.user._id });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        res.json({ message: "All notifications cleared" });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        return res.json({
            success: true,
            result: unreadCount
        });

    } catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.getNotificationsByType = async (req, res) => {
    try {
        const { type } = req.params;
        if (!["p2p", "spot", "support"].includes(type)) {
            return res.status(400).json({ message: "Invalid notification type" });
        }
        const notifications = await Notification.find({ user: req.user._id, type }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications by type:", error);
        res.status(500).json({ message: "Server error" });
    }
};  