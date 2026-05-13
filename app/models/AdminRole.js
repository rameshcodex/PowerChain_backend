const mongoose = require("mongoose");

const adminRoleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,


      trim: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminRole", adminRoleSchema);