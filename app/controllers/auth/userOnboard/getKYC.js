const KYC = require("../../../models/kyc");
const User = require("../../../models/user");
const { handleError } = require("../../../middleware/utils");
const { getItems, getItem, updateItem, deleteItem, checkQueryString } = require("../../../middleware/db");




const getKYC = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        try {
            const kyc = await getItem({ userId }, KYC);
            return res.status(200).json({
                success: true,
                message: "KYC fetched successfully",
                kycStatus: kyc.status,
                data: kyc,
            });
        } catch (err) {
            // If item is not found, return the "not submitted" response
            if (err.message === 'NOT_FOUND') {
                return res.status(200).json({
                    success: true,
                    message: "KYC not submitted",
                    kycStatus: "Not Initiated",
                    data: null,
                });
            }
            throw err;
        }
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { getKYC };

