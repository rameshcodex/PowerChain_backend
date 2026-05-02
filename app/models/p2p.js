const mongoose = require("mongoose");

const p2pSchema = new mongoose.Schema(
  {
    side: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
      index: true,
    },
    fiat: {
      type: String,
      required: true,
      index: true,
    },

    crypto: {
      type: String,
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
    },

    volume: {
      type: Number,
      required: true,
    },

    originalVolume: {
      type: Number,
      required: true,
    },

    minPrice: {
      type: Number,
    },

    maxPrice: {
      type: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // userName: {
    //   type: String,
    //   required: true,
    // },

    transactionId: {
      type: String,
      unique: true,
      index: true,
    },

    paymentMethod: {
      type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentMethod",
      }
    ],
      required: true,
      default: [],
    },
    timeLimit: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "completed", "cancelled", "paid"],
      default: "active",
      index: true,
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("P2P", p2pSchema);
