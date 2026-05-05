const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');


const userSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    password: String,
    image: String,
    twoFAEnabled: { type: Boolean, default: false, },
    twoFASecret: { type: String },
    otp: String,
    otpExpires: Date,
    googleId: String,
    provider: String,
    fromGoogle: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    favoritePairsOKX: [{ type: String }],
    futureFavoritePairsOKX: [{ type: String }],

},
    {
        timestamps: true
    }
)

const User = mongoose.model('User', userSchema);

module.exports = User