const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');


const userSchema = new mongoose.Schema({
    firstname: {
        type: String,

    },
    username: { 
        type: String, 
        unique: true 
    },
    email: { type: String, 
        unique: true 
    },
    phone: { type: String, 
        unique: true 
    },
    password: {
        type: String,
        required: true,
        select: false
    },
     otp: String,
    otpExpires: Date,
    isVerified:
     { 
        type: Boolean,
        default: false
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

const unVerifiedUsers = mongoose.model('unVerifiedUsers', userSchema);

module.exports = unVerifiedUsers