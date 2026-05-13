const Admin = require("../../models/admin");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");


const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Admin email or password is required"
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Admin email is required"
            });
        }


        if (!password) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Admin password is required"
            });
        }

        const admin = await Admin.findOne({ email }).select(" +password -__v");

        if (!admin) {
            return res.status(404).json({
                success: false,
                result: null,
                message: "Admin not found"
            });
        }

        if (admin.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: "Admin account is deactivated"
            });
        }
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Admin password is incorrect"
            });
        }

        if (admin.twoFAEnabled) {
            return res.status(200).json({
                success: true,
                result: {
                    twoFactorRequired: true
                },
                message: "Admin 2FA is enabled"
            });
        }

        const basePermissions = ["Profile"];

        const permissions = admin.role === "subadmin" ? [...basePermissions, ...admin.permissions] || basePermissions : ["ALL"];

        const payload = { userId: admin._id, permissions, role: admin.role };

        // const accessToken = jwt.sign(
        //     payload,
        //     process.env.JWT_ACCESS_SECRET,
        //     { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1d' }
        // );
        const accessToken = jwt.sign(
            payload,
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
        );

        const adminData = admin.toObject();
        delete adminData.password;

        return res.status(200).json({
            success: true,
            result: {
                admin: adminData,
                accessToken,
                refreshToken,
                permissions,
            },
            message: "Admin logged in successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            result: null,
            message: "Failed to login"
        });
        console.error("Admin login error:", err);
    }
}

module.exports = { adminLogin };