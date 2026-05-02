const mongoose = require("mongoose");


const ticketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    ticketNumber: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Open", "Closed", "All"],
        default: "Open"
    },
    isTicketResolved: {
        type: Boolean,
        default: false
    },
    time: {
        type: Date,
        default: Date.now
    },
    assignedAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    messages: [{
        from: {
            type: String,
            enum: ["user", "admin"],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]

})

const ticketModel = mongoose.model("Ticket", ticketSchema);

module.exports = ticketModel;