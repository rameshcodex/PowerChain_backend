const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Ticket = require("../../../models/createTicket");
const User = require("../../../models/user");
const Admin = require("../../../models/admin");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "https://8fvfkzzv-3001.inc1.devtunnels.ms"],
      methods: ["GET", "POST"],
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization || 
                  socket.handshake.query.token;
      
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        console.warn(`[Socket Auth] No token provided for socket: ${socket.id}. Proceeding as unauthenticated.`);
        return next();
      }

      const secret = process.env.JWT_ACCESS_SECRET;
      console.log("🚀 ~ initSocket ~ secret:", secret)
      const decoded = jwt.verify(token, secret);
      console.log("🚀 ~ initSocket ~ decoded:", decoded)

      // Extract userId from token
      let account = await User.findById(decoded.userId).select("_id name email") || 
                    await Admin.findById(decoded.userId).select("_id name email");
      console.log("🚀 ~ initSocket ~ account:", account)

      if (account) {
        socket.user = account;
        console.log(`[Socket Auth] Authenticated: ${account.name} (ID: ${account._id})`);
      } else {
        console.warn(`[Socket Auth] User not found for ID: ${decoded.userId}`);
      }
      next();
    } catch (err) {
      console.error("[Socket Auth] Token verification failed:", err.message);
      // Still allow connection but as unauthenticated
      next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      console.log("🚀 ~ initSocket ~ userId:", userId)
      const personalRoom = `user_${userId}`;
      console.log("🚀 ~ initSocket ~ personalRoom:", personalRoom)

      // Automatically join personal room for authenticated users
      socket.join(personalRoom);
      console.log(`[Socket] Authenticated user ${userId} joined personal room: ${personalRoom}`);
    } else {
      console.log(`[Socket] Unauthenticated connection: ${socket.id}`);
    }

    // Still allow manual joining for backward compatibility or public rooms
    socket.on("join_user", ({ userId }) => {
        if (!userId) return;
        const roomName = `user_${userId.toString()}`;
        socket.join(roomName);
        console.log(`[Socket] Manual room join: ${roomName}`);
    });


    // Join Support Room
    socket.on("join_support", ({ support_id }) => {
      if (support_id) {
        const roomName = support_id.toString();
        socket.join(roomName);
        console.log(`[Support Socket] User ${userId} joined room: ${roomName}`);
      }
    });

    // Send support message
    socket.on("send_support_message", async (data) => {
      try {
        const { support_id, message } = data;
        if (!support_id) return;

        const roomName = support_id.toString();
        const ticket = await Ticket.findById(support_id);
        
        if (ticket) {
          const newMessage = {
            from: message.from || (socket.user instanceof Admin ? "admin" : "user"),
            text: message.text || "",
            timestamp: new Date()
          };
          ticket.messages.push(newMessage);
          await ticket.save();

          const savedMessage = ticket.messages[ticket.messages.length - 1];
          
          io.to(roomName).emit("receive_support_message", {
            support_id: roomName,
            message: savedMessage
          });

          // Persistent notification for user
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
      console.log("[Socket] Disconnected:", socket.id);
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
