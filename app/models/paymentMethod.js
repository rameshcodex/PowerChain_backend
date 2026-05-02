const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["upi", "bank"],
      required: true,
    },
    accHolderName: {
      type: String,
      required: function () {
        return this.type === "bank";
      }
    },
    upiId: {
      type: String,
      required: function () {
        return this.type === "upi";
      }
    },
    // phoneNumber: {
    //   type: String,
    // },
    ifsc: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    accountType: {
      type: String,
      required: function () {
        return this.type === "bank";
      },
      enum: ["savings", "current"],
    },
    bankBranch: {
      type: String,
      required: function () {
        return this.type === "bank";
      }
    },
    qrCode: {
      type: String,
      required: false
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
