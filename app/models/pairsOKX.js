const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const pairsOKX = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["spot", "future"],
            required: true,
            index: true,
        },

        status: {
            type: Boolean,
            default: true,
            index: true,
        },

        baseAsset: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        baseAssetPrecision: {
            type: Number,
            default: 8,
        },

        quoteAsset: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        quoteAssetPrecision: {
            type: Number,
            default: 8,
        },

        minPrice: {
            type: Number,
            default: 0,
        },

        maxPrice: {
            type: Number,
            default: 0,
        },

        tickSize: {
            type: Number,
            default: 0,
        },

        minQty: {
            type: Number,
            default: 0,
        },

        maxQty: {
            type: Number,
            default: 0,
        },

        stepSize: {
            type: Number,
            default: 0,
        },

        minNotional: {
            type: Number,
            default: 0,
        },

        maxNotional: {
            type: Number,
            default: 0,
        },
        buyCommission: {
            type: Number,
            default: 0,
        },
        sellCommission: {
            type: Number,
            default: 0,
        },
        exchange: {
            type: [String],
            default: ["OKX"],
            index: true,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// compound unique index
pairsOKX.index(
    {
        symbol: 1,
        type: 1,
    },
    {
        unique: true,
    }
);

pairsOKX.plugin(mongoosePaginate);

module.exports = mongoose.model("okxpairs", pairsOKX);