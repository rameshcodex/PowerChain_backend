const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');


const userSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    image: String,
    country: { type: String },
    telegramId: { type: String },
    telegramUsername: { type: String },
    twoFAEnabled: { type: Boolean, default: false, },
    twoFASecret: { type: String },
       password: {
        type: String,
        required: true,
        select: false
    },
    otp: String,
    otpExpires: Date,
    googleId: String,
    provider: String,
    fromGoogle: { type: Boolean, default: false },
    
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    
      deviceDetails: {
        deviceIPAddress: String,
        deviceType: String,
    },
    kycStatus: {
        type: String,
        enum: ['Not Initiated', 'pending', 'verified', 'rejected'],
        default: 'Not Initiated'
    },


},
{
    timestamps: true,
  })

const User = mongoose.model('User', userSchema);

module.exports = User