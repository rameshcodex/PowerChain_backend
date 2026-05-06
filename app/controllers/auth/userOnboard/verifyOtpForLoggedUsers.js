const { matchedData } = require("express-validator");
const User = require("../../../models/user");
const bcrypt = require("bcryptjs");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const { sendNotification } = require("../../../utils/notificationHelper");
const { logger } = require("../../../../winston");
const { handleError } = require("../../../middleware/utils");

const verifyOtpForLoggedUsers = async (req, res) => {
    try {
        const data = matchedData(req);
        const { email, otp, password } = data;
        
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "Email not found"
            });
        }
        if (user.isVerified === false) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "User is not verified"
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Invalid OTP. Please Enter valid OTP"
            });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "OTP has expired. Please request a new OTP"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;

        await user.save();

        const Title = "Password reset successfully";
        const message = `Your password has been changed successfully.`;
        await sendNotification({
            userId: user._id,
            type: "user",
            event: "password_changed",
            title: Title,
            message: message,
        });
        logger.notification(`Sending notification to user ${user._id}: ${Title} - ${message}`);

        sendOtpEmail({
            checkedEmail: user.email,
            username: user.name || user.username,
            temp: "password_reset",
            subject: "Password Reset Successful"
        }).catch((err) => {
            console.error("Failed to send password reset email:", err.message);
        });

        return res.status(200).json({
            success: true,
            result: null,
            message: "Password reset successfully"
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { verifyOtpForLoggedUsers };