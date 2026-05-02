const mongoose = require("mongoose");

const ownWalletTransferSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    ownWalletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ownWallet",
        required: true,
        index: true,
    },
    asset: {
        type: String,
        required: true,
        uppercase: true,
        index: true,
    },
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
}

    , {
        timestamps: true
    }
);

const ownWalletTransfer = mongoose.model("ownWalletTransfer", ownWalletTransferSchema);

module.exports = ownWalletTransfer