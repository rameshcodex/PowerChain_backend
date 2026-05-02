const { Server } = require("socket.io");
const Ticket = require("../../../models/createTicket");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "https://8fvfkzzv-3001.inc1.devtunnels.ms"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // User/Admin joins support room
    socket.on("join_support", ({ support_id }) => {
      if (support_id) {
        const roomName = support_id.toString();
        socket.join(roomName);
        console.log(`[Support Socket] Socket ${socket.id} joined support room: ${roomName}`);
      }
    });

    // User joins their own room for notifications
    socket.on("join_user", ({ userId }) => {
      const roomName = `user_${userId.toString()}`;
      socket.join(roomName);
      console.log(`User joined personal room: ${roomName}`);
    });

    // Send support message (for those using pure socket to send)
    socket.on("send_support_message", async (data) => {
      try {
        const { support_id, message } = data;
        if (!support_id) return;

        const roomName = support_id.toString();
        console.log(`[Support Socket] Received send_support_message for room: ${roomName}`);

        const ticket = await Ticket.findById(support_id);
        if (ticket) {
          const newMessage = {
            from: message.from || "user",
            text: message.text || "",
            timestamp: new Date()
          };
          ticket.messages.push(newMessage);
          await ticket.save();

          const savedMessage = ticket.messages[ticket.messages.length - 1];
          console.log(`[Support Socket] Message saved and broadcasting to: ${roomName}`);

          // broadcast to room
          io.to(roomName).emit("receive_support_message", {
            support_id: roomName,
            message: savedMessage
          });

          // Send persistent notification if message is from admin to user
          if (newMessage.from === "admin") {
            try {
              const { sendNotification } = require("../../../utils/notificationHelper");
              await sendNotification({
                userId: ticket.userId,
                type: "support",
                event: "support_message",
                title: "Support Ticket Update",
                message: newMessage.text || "You have a new reply from support.",
                referenceId: ticket._id.toString(),
              });
            } catch (notifyErr) {
              console.error("[Support Socket] Notification error:", notifyErr);
            }
          }
        } else {
          console.warn(`[Support Socket] Support Ticket not found: ${support_id}`);
        }
      } catch (error) {
        console.error("[Support Socket] Error handling send_support_message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};


const closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    if (ticket.status === "closed") {
      return res.status(400).json({ success: false, message: "Ticket already closed" });
    }
    ticket.status = "closed";
    await ticket.save();
    res.status(200).json({ success: true, message: "Ticket closed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }


}
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, closeTicket, getIO };
