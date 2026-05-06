const jwt = require("jsonwebtoken");
const User = require("../../../models/user");
const { handleError } = require("../../../middleware/utils");

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.headers.authorization;

        if (!refreshToken || !refreshToken.startsWith("Bearer ")) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Refresh token required"
            });
        }

        const token = refreshToken.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                result: null,
                message: "User not found"
            });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES }
        );

        return res.status(200).json({
            success: true,
            result: { accessToken: newAccessToken },
            message: "Access token refreshed"
        });

    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { refreshToken };

