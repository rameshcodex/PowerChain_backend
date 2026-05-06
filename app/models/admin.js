const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin","subadmin", "superadmin"],
      default: "subadmin",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// compound indexes
adminSchema.index({ email: 1, isDeleted: 1 });
adminSchema.index({ status: 1, role: 1 });

adminSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Admin", adminSchema);