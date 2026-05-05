const KYC = require("../../../models/kyc");
const User = require("../../../models/user");


const getKYC = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const kyc = await KYC.findOne({ userId });

        if (!kyc) {
            return res.status(200).json({
                success: true,
                message: "KYC not submitted",
                kycStatus: "Not Initiated",
                data: null,
            });
        }

        return res.status(200).json({
            success: true,
            message: "KYC fetched successfully",
            kycStatus: kyc.status,
            data: kyc,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { getKYC };
