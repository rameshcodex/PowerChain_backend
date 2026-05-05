const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    // otp: String,
    // otpExpires: Date,
    role: { type: String, default: "admin" },
},
    {
        timestamps: true
    }
)

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin