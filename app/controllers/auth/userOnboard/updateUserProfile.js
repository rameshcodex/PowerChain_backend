const User = require("../../../models/user");
const { updateItem } = require("../../../middleware/db");
const { handleError } = require("../../../middleware/utils");

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { email, phone, username, name, country, telegramId, telegramUsername } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "User not found"
            });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    result: null,
                    message: "Username already taken"
                });
            }
        }

        const payload = {
            email,
            username,
            phone,
            name,
            country,
            telegramId,
            telegramUsername
        };

        const updatedUser = await updateItem(userId, User, payload);

        // Remove password from response if somehow it got included
        const responseData = updatedUser.toObject();
        delete responseData.password;

        res.status(200).json({
            success: true,
            result: responseData,
            message: "Profile updated successfully"
        });

    } catch (error) {
        handleError(res, error);
    }
}

module.exports = { updateUserProfile };

