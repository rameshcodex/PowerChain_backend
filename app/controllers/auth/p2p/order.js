const P2POrder = require("../../../models/p2pOrder");
const P2P = require("../../../models/p2p");
const { sendNotification } = require("../../../utils/notificationHelper");
const { logger } = require("../../../../winston");

const createTrade = async (req, res) => {
    try {
        const { postId } = req.body;
        const currentUserId = req.user._id;

        const ad = await P2P.findById(postId);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }

        if (ad.userId.toString() === currentUserId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot trade with your own ad" });
        }

        let sellerId, buyerId;

        if (ad.side === "sell") {
            sellerId = ad.userId;
            buyerId = currentUserId;
        } else {
            sellerId = currentUserId;
            buyerId = ad.userId;
        }

        let existingOrder = await P2POrder.findOne({ postId, sellerId, buyerId });
        if (existingOrder) {
            return res.status(200).json({
                success: true,
                message: "Existing trade found",
                result: existingOrder,
            });
        }
        // set pp2 status to pendin

        const newOrder = new P2POrder({
            postId,
            sellerId,
            buyerId,
            messages: [],
        });

        await newOrder.save();

        const sellerTitle = "New Order Received";
        const sellerMessage = `You have a new order for ${ad.crypto}.`;
        await sendNotification({
            userId: sellerId,
            type: "p2p",
            event: "order_created",
            title: sellerTitle,
            message: sellerMessage,
            referenceId: newOrder._id.toString(),
        });
        logger.notification(`Sending notification to user ${sellerId}: ${sellerTitle} - ${sellerMessage}`);


        const buyerTitle = "Order Placed Successfully";
        const buyerMessage = `You have successfully placed an order for ${ad.crypto}.`;
        await sendNotification({
            userId: buyerId,
            type: "p2p",
            event: "order_created",
            title: buyerTitle,
            message: buyerMessage,
            referenceId: newOrder._id.toString(),
        });
        logger.notification(`Sending notification to user ${buyerId}: ${buyerTitle} - ${buyerMessage}`);

        res.status(201).json({
            success: true,
            message: "Chat initiated successfully",
            result: newOrder,
        });
    } catch (error) {
        console.error("Error initiating P2P chat:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getOrderById = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const { id } = req.params;
        // const order = await P2POrder.findOne({ transactionId: id })
        let query;
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ _id: id }, { orderId: id }, { transactionId: id }] };
        } else {
            query = { $or: [{ orderId: id }, { transactionId: id }] };
        }

        const order = await P2POrder.findOne(query)
            .populate("sellerId", "name username email")
            .populate("buyerId", "name username email")
            .populate("paymentMethodId")
            .populate("messages.from", "name username");

        if (!order) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        // Check if user is part of the chat
        const userId = req.user._id.toString();
        if (order.sellerId._id.toString() !== userId && order.buyerId._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, result: order });
    } catch (error) {
        console.error("Get Order Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// const getOrderById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const order = await P2POrder.findOne({ transactionId: id })
//             .populate("sellerId", "name username email")
//             .populate("buyerId", "name username email")
//             .populate("messages.from", "name username");

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found"
//             });
//         }

//         const userId = req.user._id.toString();

//         if (
//             order.sellerId._id.toString() !== userId &&
//             order.buyerId._id.toString() !== userId
//         ) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Unauthorized access"
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             result: order
//         });

//     } catch (error) {
//         console.error("Get Order Error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };


const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, side, crypto, status, fiat } = req.query;

        const conditions = [];
        if (side === 'buy') {
            conditions.push({ buyerId: userId });
        } else if (side === 'sell') {
            conditions.push({ sellerId: userId });
        } else {
            conditions.push({ $or: [{ sellerId: userId }, { buyerId: userId }] });
        }

        if (crypto && crypto !== 'all') {
            conditions.push({ crypto });
        }

        if (status && status !== 'all') {
            conditions.push({ status });
        }

        if (fiat && fiat !== 'all') {
            conditions.push({ fiat });
        }

        if (req.query.search) {
            conditions.push({
                $or: [
                    { orderId: { $regex: req.query.search, $options: 'i' } },
                    { transactionId: { $regex: req.query.search, $options: 'i' } }
                ]
            });
        }

        const query = conditions.length > 0 ? { $and: conditions } : {};

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const pageSize = parseInt(limit);

        const orders = await P2POrder.find(query)
            .sort({ createdAt: -1 })
            .populate("sellerId", "name username")
            .populate("buyerId", "name username")
            .populate("postId", "crypto fiat price side")
            .skip(skip)
            .limit(pageSize);

        const total = await P2POrder.countDocuments(query);

        res.status(200).json({
            success: true,
            result: orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error("getUserOrders error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { createTrade, getOrderById, getUserOrders };
