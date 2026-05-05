const KYC = require("../../../models/kyc");
const User = require("../../../models/user");
const { sendNotification } = require("../../../utils/notificationHelper");
const { notifyKycStatusChanged } = require("../../../utils/kycNotificationService");


const updateKYCStatus = async (req, res) => {
    try {
        const { kycId } = req.params;
        const { status, rejectionReason } = req.body;

        const normalizedStatus = String(status || "").toLowerCase();
        const nextStatus = normalizedStatus === "approved" ? "verified" : normalizedStatus;

        if (!["verified", "rejected"].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved, verified, or rejected",
            });
        }

        const kyc = await KYC.findByIdAndUpdate(
            kycId,
            { status: nextStatus },
            { new: true, runValidators: true }
        );

        if (!kyc) {
            return res.status(404).json({
                success: false,
                message: "KYC not found",
            });
        }

        await User.findByIdAndUpdate(kyc.userId, { kycStatus: nextStatus });
        await notifyKycStatusChanged({ kycId: kyc._id, status: nextStatus, rejectionReason });

        return res.status(200).json({
            success: true,
            message: `KYC ${nextStatus === "verified" ? "approved" : "rejected"} successfully`,
            data: kyc,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { updateKYCStatus };