const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const mongoosePaginate = require('mongoose-paginate-v2')



const userSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    image: String,
    country: { type: String },
    // telegramId: { type: String },
    // telegramUsername: { type: String },
    twoFAEnabled: { type: Boolean, default: false, },
    twoFASecret: { type: String },
    password: {
        type: String,

        select: false
    },
    otp: String,
    otpExpires: Date,
    googleId: String,
    provider: String,
    fromGoogle: { type: Boolean, default: false },

    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    status: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },

    deviceDetails: {
        deviceIPAddress: String,
        deviceType: String,
    },
    kycStatus: {
        type: String,
        enum: ['Not Initiated', 'pending', 'verified', 'rejected'],
        default: 'Not Initiated',
        index: true
    },
    favoritePairsOKX: [{ type: String, default: [] }],
    futureFavoritePairsOKX: [{ type: String, default: [] }],

},
    {
        timestamps: true,
    })

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

userSchema.plugin(mongoosePaginate)
const User = mongoose.model('User', userSchema);

module.exports = User