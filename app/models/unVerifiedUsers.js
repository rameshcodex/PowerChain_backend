const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');


const userSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
})

const unVerifiedUsers = mongoose.model('unVerifiedUsers', userSchema);

module.exports = unVerifiedUsers