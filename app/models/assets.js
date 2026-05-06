const mongoose = require("mongoose");

const assetsSchema = new mongoose.Schema({
    DepositStatus: { type: Boolean, default: false },
    WithdrawalStatus: { type: Boolean, default: false },
    assetname: String,
    symbol: String,
    networkIds: [
        {
            networkId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "network",
                required: true
            },
            contractAddress: String,
            withdrawalFees: Number,
            minWithDraw: Number,
            minDeposit: Number,
            maxWithDraw: Number
        }
    ],
    image: String,
    status: { type: Boolean, default: false },
    exchange: [String]
},
    {
        timestamps: true
    })

assetsSchema.index({ symbol: 1 });
assetsSchema.index({ status: 1 });

const assets = mongoose.model("assets", assetsSchema);

module.exports = assets;


