const Ticket = require("../../models/createTicket");
const { sendNotification } = require("../../utils/notificationHelper");

const sendMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;
    const user = req.user;

    console.log(" Send message request:", ticketId);

    // 1. Validate message
    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    // 2. Find ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // 3. Authorization
    const isOwner = ticket.userId.toString() === user._id.toString();
    const isAdmin = ["admin", "superadmin"].includes(user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send messages to this ticket",
      });
    }

    // 4. Create message
    const newMessage = {
      from: isAdmin ? "admin" : "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    ticket.messages.push(newMessage);

    // 5. Auto-assign admin if needed
    if (isAdmin && !ticket.assignedAdmin) {
      ticket.assignedAdmin = user._id;
      console.log("👤 Ticket assigned to admin:", user._id);
    }

    await ticket.save();

    // Notify user if admin replied
    if (isAdmin) {
      await sendNotification({
        userId: ticket.userId,
        type: "support",
        event: "support_message",
        title: "New Support Reply",
        message: "Support team replied to your ticket.",
        referenceId: ticket._id.toString(),
      });
    }

    // Get saved message (with _id)
    const savedMessage = ticket.messages.at(-1);

    console.log(" Message saved:", savedMessage);

    // 6. Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(ticketId).emit("receive_support_message", {
        support_id: ticketId,
        message: savedMessage,
      });
      console.log(" Support Socket event emitted via REST API");
    }

    // 7. Response
    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      result: savedMessage,
    });

  } catch (error) {
    console.error("❌ Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { sendMessage };




// const Ticket = require("../../models/createTicket");

// const sendMessage = async (req, res) => {
//     try {
//         const { ticketId } = req.params;
//         const { text } = req.body;

//         console.log(" Send message request for ticket:", ticketId);

//         // Validate input
//         if (!text || typeof text !== "string" || text.trim().length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Message text is required"
//             });
//         }

//         // Find the ticket
//         const ticket = await Ticket.findById(ticketId);

//         if (!ticket) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Ticket not found"
//             });
//         }

//         // Check if user owns the ticket OR is an admin
//         const isUserOwner = ticket.userId.toString() === req.user._id.toString();
//         const isAdminUser = req.user.role === 'admin' || req.user.role === 'superadmin';

//         if (!isUserOwner && !isAdminUser) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Unauthorized to send message to this ticket"
//             });
//         }

//         // Add message to ticket
//         const newMessage = {
//             from: isAdminUser ? "admin" : "user",
//             text: text.trim(),
//             timestamp: new Date()
//         };

//         ticket.messages.push(newMessage);

//         // If admin is messaging and ticket is not assigned, assign it
//         if (isAdminUser && !ticket.assignedAdmin) {
//             ticket.assignedAdmin = req.user._id;
//             console.log(" Ticket assigned to admin:", req.user._id);
//         }

//         await ticket.save();

//         // Get the saved message with its _id
//         const savedMessage = ticket.messages[ticket.messages.length - 1];

//         console.log(" Message saved to DB:", savedMessage);

//         // Emit socket event for real-time update
//         const io = req.app.get('io');
//         if (io) {
//             console.log(" Emitting socket event to room:", ticketId);
//             io.to(ticketId).emit('receive_message', {
//                 ticketId,
//                 message: savedMessage
//             });
//             console.log(" Socket event emitted");
//         } else {
//             console.warn(" Socket.IO instance not found!");
//         }

//         res.status(200).json({
//             success: true,
//             message: "Message sent successfully",
//             result: savedMessage
//         });
//     } catch (error) {
//         console.error("Error sending message:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// module.exports = { sendMessage };
