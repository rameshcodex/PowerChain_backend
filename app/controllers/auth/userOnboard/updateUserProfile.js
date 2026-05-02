const User = require("../../../models/user");

const updateUserProfile = async (req, res) => {
    try {

        const userId = req.user._id;
        const { email, phone, username, name } = req.body;
        // const { profileImage } = req.files;

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

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    email,
                    username,
                    phone,
                    name
                },
            },
            { new: true }
        ).select("-password");
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            result: updatedUser,
            message: "Profile updated successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            result: null,
            message: "Failed to update profile"
        });
    }
}

module.exports = { updateUserProfile };
