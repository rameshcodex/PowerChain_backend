const Ticket = require("../../../models/createTicket");


const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.status(200).json({
            success: true,
            message: "Tickets found",
            result: tickets
        });
    } catch (error) {
        console.error("Error getting tickets:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = { getAllTickets };

