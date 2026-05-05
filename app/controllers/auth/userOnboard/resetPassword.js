const { matchedData } = require("express-validator");
const User = require("../../../models/user");
const bcrypt = require("bcryptjs");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const { sendNotification } = require("../../../utils/notificationHelper");
const { logger } = require("../../../../winston");

const resetPassword = async (req, res) => {
    try {
        const data = matchedData(req);

        const userId = req.user._id;

        const deviceName = req.body.deviceName || req.body.deviceType || req.headers['user-agent'] || "Unknown device";
        const deviceIPAddress =
            (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').shift().trim()) ||
            req.socket?.remoteAddress ||
            req.ip ||
            null;




        const user = await User.findOne({ _id: userId }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "User not found"
            });
        }


        const { oldPassword, password } = data;

        // Only verify old password if the user already has one set (needs +password on query)
        if (user.password && user.password !== "") {
            if (!oldPassword || oldPassword === "empty") {
                return res.status(400).json({
                    success: false,
                    result: null,
                    message: "Old password is required"
                });
            }

            const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
            if (!isOldPasswordCorrect) {
                return res.status(400).json({
                    success: false,
                    result: null,
                    message: "Old password is wrong"
                });
            }
        }

        // Check if new password is same as old
        if (user.password && user.password !== "") {
            const isSamePassword = await bcrypt.compare(password, user.password);
            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    result: null,
                    message: "New password cannot be the same as old password"
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        await user.save();

        const Title = "Password Changed";
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
            temp: "password_changed",
            subject: "Password Changed Successfully",
            deviceName,
            deviceIPAddress,
        }).catch((err) => {
            console.error("Failed to send password changed email:", err.message);
        });

        return res.status(200).json({
            success: true,
            result: null,
            message: "Password updated successfully"
        });
    } catch (err) {
        console.error("Failed to reset password:", err.message);
        res.status(500).json({
            success: false,
            result: null,
            message: "Failed to reset password"
        });
    }
}

module.exports = resetPassword;