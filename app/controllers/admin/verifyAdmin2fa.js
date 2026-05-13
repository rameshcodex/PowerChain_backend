const speakeasy = require("speakeasy");
const { sendNotification } = require("../../utils/notificationHelper");
const { logger } = require("../../../winston");
const { handleError } = require("../../middleware/utils");

const verifyAdmin2fa = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required",
            });
        }

        const verified = speakeasy.totp.verify({
            secret: req.user.twoFASecret,
            encoding: "base32",
            token: String(otp),
            window: 1,
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        req.user.twoFAEnabled = true;
        await req.user.save();

        const Title = "2FA Enabled";
        const message = `Your 2FA has been enabled successfully.`;
        await sendNotification({
            userId: req.user._id,
            type: "admin",
            event: "2fa_enabled",
            title: Title,
            message: message,
        });
        logger.notification(`Sending notification to admin ${req.user._id}: ${Title} - ${message}`);

        return res.status(200).json({
            success: true,
            message: "2FA enabled successfully",
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    verifyAdmin2fa,
};
