const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        asset: {
            type: String,
            required: true,
            uppercase: true,
        },
        network: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        fee: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "rejected", "cancelled"],
            default: "pending",
        },
        txHash: {
            type: String,
        },
        reason: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const WithdrawRequest = mongoose.model("WithdrawRequest", withdrawRequestSchema);

module.exports = WithdrawRequest;
