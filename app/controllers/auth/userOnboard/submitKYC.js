const KYC = require("../../../models/kycModel");


const submitKYC = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            firstName,
            middleName,
            lastName,
            dateOfBirth,
            gender,
            nationality,
            placeOfBirth,
            phoneNumber,
            address,
            selectIDType,
            idenditynumber,
            dateofexpiry,
            personalinformation
        } = req.body;

        let existingKYC = await KYC.findOne({ userId });

        // Uploaded files
        const files = req.files || {};

        const uploadedIdentification = {
            selectIDType,
            idenditynumber,
            dateofexpiry,
            personalinformation,
        };

        // Passport
        if (files.passportFront?.[0]) {
            uploadedIdentification.passportNumber = {
                frontimage: `/uploads/kyc/${files.passportFront[0].filename}`
            };
        }

        // National ID
        if (files.nationalFront?.[0] || files.nationalBack?.[0]) {
            uploadedIdentification.nationalID = {
                frontimage: files.nationalFront?.[0]
                    ? `/uploads/kyc/${files.nationalFront[0].filename}`
                    : "",
                backimage: files.nationalBack?.[0]
                    ? `/uploads/kyc/${files.nationalBack[0].filename}`
                    : "",
            };
        }

        // Greenbook
        if (files.greenbookFront?.[0]) {
            uploadedIdentification.greenbook = {
                frontimage: `/uploads/kyc/${files.greenbookFront[0].filename}`
            };
        }

        // Generic document
        if (files.documentFront?.[0]) {
            uploadedIdentification.documentupload = {
                frontimage: `/uploads/kyc/${files.documentFront[0].filename}`
            };
        }

        if (existingKYC) {
            existingKYC.firstName = firstName;
            existingKYC.middleName = middleName;
            existingKYC.lastName = lastName;
            existingKYC.dateOfBirth = dateOfBirth;
            existingKYC.gender = gender;
            existingKYC.nationality = nationality;
            existingKYC.placeOfBirth = placeOfBirth;
            existingKYC.phoneNumber = phoneNumber;
            existingKYC.address = typeof address === "string"
                ? JSON.parse(address)
                : address;
            existingKYC.identification = uploadedIdentification;
            existingKYC.status = "pending";

            await existingKYC.save();

            return res.status(200).json({
                success: true,
                message: "KYC updated successfully",
                data: existingKYC
            });
        }

        const newKYC = new KYC({
            userId,
            firstName,
            middleName,
            lastName,
            dateOfBirth,
            gender,
            nationality,
            placeOfBirth,
            phoneNumber,
            address: typeof address === "string"
                ? JSON.parse(address)
                : address,
            identification: uploadedIdentification,
            status: "pending"
        });

        await newKYC.save();

        return res.status(201).json({
            success: true,
            message: "KYC submitted successfully",
            data: newKYC
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { submitKYC };