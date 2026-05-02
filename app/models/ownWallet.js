const mongoose = require("mongoose");

const ownWalletSchema = new mongoose.Schema(
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
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    icon: {
      type: String,
    },
    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    free: {
      type: Number,
      default: 0,
      min: 0,
    },

    locked: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ownWallet = mongoose.model("ownWallet", ownWalletSchema);

module.exports = ownWallet;

