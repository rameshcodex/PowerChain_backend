const { matchedData } = require("express-validator");
const User = require("../../../models/user");
const bcrypt = require("bcryptjs");
const { sendNotification } = require("../../../utils/notificationHelper");
const { logger } = require("../../../../winston");

const resetPassword = async (req, res) => {
    try {
        const data = matchedData(req);

        const { email, password, oldPassword } = data;
        console.log("Resetting password for email:", email);

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "Email not found"
            });
        }

        // Only verify old password if the user already has one set
        if (user.password && user.password !== "") {
            // If the user has a password, they MUST provide the correct old password
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
                    message: "Old password is incorrect"
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