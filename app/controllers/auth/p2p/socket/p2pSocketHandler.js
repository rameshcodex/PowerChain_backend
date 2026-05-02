const P2POrder = require("../../../../models/p2pOrder");
const mongoose = require("mongoose");
const { sendNotification } = require("../../../../utils/notificationHelper");

const setupP2PSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`[P2P Socket] New connection: ${socket.id}`);

        // Join P2P room
        socket.on("join_p2p", (p2p_id) => {
            if (!p2p_id) return;
            const roomName = p2p_id.toString();
            socket.join(roomName);
            console.log(`[P2P Socket] User joined room: ${roomName}`);
        });

        // Handle P2P chat messages
        socket.on("send_p2p_message", async ({ p2p_id, text, userId, image }) => {
            try {
                if (!p2p_id || (!text && !image)) return;

                const roomName = p2p_id.toString();
                // Find order and save message
                let query;
                if (mongoose.Types.ObjectId.isValid(p2p_id)) {
                    query = { $or: [{ _id: p2p_id }, { orderId: p2p_id }] };
                } else {
                    query = { orderId: p2p_id };
                }

                const order = await P2POrder.findOne(query);
                if (!order) {
                    console.warn(`[P2P Socket] P2P Order not found: ${p2p_id}`);
                    return;
                }

                const newMessage = {
                    from: userId,
                    text: text || "",
                    image: image || "",
                    timestamp: new Date(),
                };

                order.messages.push(newMessage);
                await order.save();

                // Broadcast back to room
                io.to(roomName).emit("receive_p2p_msg", newMessage);

                // Send persistent notification to the other party
                const recipientId = order.buyerId.toString() === userId.toString() ? order.sellerId : order.buyerId;
                await sendNotification({
                    userId: recipientId,
                    type: "p2p",
                    event: "order_message",
                    title: "New P2P Message",
                    message: text || "You have received a new image message.",
                    referenceId: order._id.toString(),
                });

                console.log(`[P2P Socket] Message sent in room: ${roomName}`);
            } catch (error) {
                console.error("[P2P Socket] Message error:", error);
            }
        });

        // Handle order updates (status changes, etc.)
        socket.on("p2p_update", async ({ p2p_id }) => {
            if (!p2p_id) return;
            const roomName = p2p_id.toString();
            io.to(roomName).emit("p2p_updated");
            console.log(`[P2P Socket] P2P update broadcasted: ${roomName}`);

            // Also emit to other room variants (transactionId, orderId, _id)
            try {
                const mongoose = require("mongoose");
                let query;
                if (mongoose.Types.ObjectId.isValid(p2p_id)) {
                    query = { $or: [{ _id: p2p_id }, { orderId: p2p_id }, { transactionId: p2p_id }] };
                } else {
                    query = { $or: [{ orderId: p2p_id }, { transactionId: p2p_id }] };
                }
                const order = await P2POrder.findOne(query);
                if (order) {
                    const rooms = [order._id.toString(), order.transactionId, order.orderId].filter(Boolean);
                    rooms.forEach(r => {
                        const rm = r.toString();
                        if (rm !== roomName) {
                            io.to(rm).emit("p2p_updated");
                        }
                    });
                }
            } catch (err) {
                console.error("[P2P Socket] Error broadcasting to alternate rooms:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log(`[P2P Socket] Disconnected: ${socket.id}`);
        });
    });
};

module.exports = { setupP2PSocket };
