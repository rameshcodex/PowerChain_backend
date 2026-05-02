const mongoose = require("mongoose");

const p2pOrderSchema = new mongoose.Schema(
    {

        transactionId: {
            type: String,
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            // unique: true
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "P2P",
            required: true,
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        paymentMethodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentMethod",
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        image: {
            type: String,
        },
        paymentStatus: {
            type: Boolean,
            default: false,
        },
        crypto: {
            type: String,
            required: true,
        },
        fiat: {
            type: String,
            required: true,
        },
        coinName: {
            type: String,
            required: true,
        },

        messages: [
            {
                from: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                text: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        status: {
            type: String,
            enum: ["completed", "pending", "cancelled", "paid", "timeout"],
            // enum: ["open", "completed", "cancelled", "pending", "paid"],
            default: "pending",
        },
        expireTime: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("P2POrder", p2pOrderSchema);
