const Ticket = require("../../models/createTicket");
const { sendNotification } = require("../../utils/notificationHelper");

const createTicket = async (req, res) => {
  try {
    const { title, reason } = req.body;

    //  validation
    if (!title || !reason) {
      return res.status(400).json({
        success: false,
        message: "Title and reason are required"
      });
    }

    if (typeof title !== "string" || typeof reason !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title and reason must be strings"
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters long"
      });
    }

    if (reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Reason must be at least 5 characters long"
      });
    }

    const userId = req.user._id;

    //  generate ticket number
    const ticketNumber = `ticket-${Date.now()}`;

    const newTicket = new Ticket({
      userId,
      ticketNumber,
      title: title.trim(),
      reason: reason.trim(),
      status: "Open",
      isTicketResolved: false,
      messages: [{
        from: "user",
        text: reason.trim(),
        timestamp: new Date()
      }]
    });

    await newTicket.save();

    // Send notification to user
    await sendNotification({
      userId: userId,
      type: "support",
      event: "support_created",
      title: "Support Ticket Created",
      message: `Your ticket #${ticketNumber} has been created successfully. Our team will review it soon.`,
      referenceId: newTicket._id.toString(),
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      result: newTicket
    });

  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = { createTicket };
