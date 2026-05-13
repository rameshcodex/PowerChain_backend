const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/admin");
const { handleError } = require("../../middleware/utils");

const admin2faLogin = async (req, res) => {
    try {
        const { otp, email, password } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required",
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

        const admin = await Admin.findOne({ email }).select("+password")
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        const verified = speakeasy.totp.verify({
            secret: admin.twoFASecret,
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

        const basePermissions = ["Profile"];

        const permissions = admin.role === "subadmin" ? [...basePermissions, ...admin.permissions] || basePermissions : ["ALL"];

        const payload = { userId: admin._id, permissions, role: admin.role };

        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES,
        });

        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES,
        });

        return res.status(200).json({
            success: true,
            result: {
                accessToken,
                refreshToken,
                admin: { ...admin.toObject(), permissions: permissions },
                permissions
            },
            message: "2FA verified successfully",
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    admin2faLogin,
};