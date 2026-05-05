const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['Not Initiated', 'pending', 'verified', 'rejected'],
        default: 'Not Initiated'
    },

    firstName: {
        type: String,
    },
    middleName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female']
    },
    nationality: {
        type: String,
    },
    placeOfBirth: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    address: {
        buildingno: String,
        street: String,
        city: String,
        state: String,
        residence: String,
        landmark: String,
    },
    identification: {
        passportNumber: {
            frontimage: String,
        },
        nationalID: {
            frontimage: String,
            backimage: String,
        },
        greenbook: {
            frontimage: String,
        },
        idenditynumber: {
            type: String,
        },
        selectIDType: {
            type: String,
            enum: ['passport', 'national_id', 'nationalID', 'driving_license', 'drivingLicense'],
        },

        dateofexpiry: {
            type: Date,
        },
        documentupload: {
            frontimage: String,
        },
        personalinformation: {
            type: Boolean,

        }

    }

});

const KYC = mongoose.model('KYC', kycSchema);

module.exports = KYC;
