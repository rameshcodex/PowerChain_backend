const speakeasy = require("speakeasy");
const { sendNotification } = require("../../utils/notificationHelper");
const { logger } = require("../../../winston");
const { handleError } = require("../../middleware/utils");

const disableAdmin2fa = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required",
            });
        }

        if (!req.user.twoFAEnabled || !req.user.twoFASecret) {
            return res.status(400).json({
                success: false,
                message: "2FA is not enabled",
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

        req.user.twoFAEnabled = false;
        await req.user.save();

        const Title = "2FA Disabled";
        const message = `Your 2FA has been disabled successfully.`;
        await sendNotification({
            userId: req.user._id,
            type: "admin",
            event: "2fa_disabled",
            title: Title,
            message: message,
        });
        logger.notification(`Sending notification to admin ${req.user._id}: ${Title} - ${message}`);

        return res.status(200).json({
            success: true,
            message: "2FA disabled successfully",
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { disableAdmin2fa }