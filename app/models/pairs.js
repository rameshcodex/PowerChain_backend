const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const pairSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
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
      uppercase: true,
      index: true,
    },

    baseAssetPrecision: {
      type: Number,
      default: 8,
      min: 0,
    },

    quoteAsset: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    quoteAssetPrecision: {
      type: Number,
      default: 0,
      min: 0,
    },

    minPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    tickSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    minQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    stepSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    minNotional: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxNotional: {
      type: Number,
      default: 0,
      min: 0,
    },

    exchange: {
      type: [String],
      default: [],
      enum: ["BINANCE", "OKX"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// compound indexes
pairSchema.index({ baseAsset: 1, quoteAsset: 1 });
pairSchema.index({ status: 1, quoteAsset: 1 });

pairSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Pair", pairSchema);