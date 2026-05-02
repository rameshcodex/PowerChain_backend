const Ticket = require("../../models/createTicket");

const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Ticket found",
            result: ticket
        });
    } catch (error) {
        console.error("Error getting ticket by id:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = { getTicketById };
