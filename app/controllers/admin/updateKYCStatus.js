const KYC = require("../../models/kyc");
const User = require("../../models/user");
const { sendNotification } = require("../../utils/notificationHelper");
const { notifyKycStatusChanged } = require("../../utils/kycNotificationService");

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

        const kyc = await updateItem(kycId, KYC, { status: nextStatus });

        await updateItem(kyc.userId, User, { kycStatus: nextStatus });
        await notifyKycStatusChanged({ kycId: kyc._id, status: nextStatus, rejectionReason });

        return res.status(200).json({
            success: true,
            message: `KYC ${nextStatus === "verified" ? "approved" : "rejected"} successfully`,
            data: kyc,
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { updateKYCStatus };