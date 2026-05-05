const mongoose = require("mongoose");

const pairSchema = new mongoose.Schema({
    symbol: String,
    status: { type: Boolean, default: false },
    baseAsset: String,
    baseAssetPrecision: Number,
    quoteAsset: String,
    quoteAssetPrecision: Number,
    minPrice: Number,
    maxPrice: Number,
    tickSize: Number,
    minQty: Number,
    maxQty: Number,
    stepSize: Number,
    minNotional: Number,
    maxNotional: Number,
    exchange:[String]


},
{
    timestamps: true,
  })

const pairs = mongoose.model("pairs", pairSchema);

module.exports = pairs

