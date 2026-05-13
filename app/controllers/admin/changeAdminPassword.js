//PUT Change Admin Password
const Admin = require("../../models/admin");

const changeAdminPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) return res.status(400).json({
            success: false,
            message: "Old password and new password are required",
        });

        const admin = await Admin.findById(req?.user?._id).select('+password');

        if (!admin) return res.status(404).json({
            success: false,
            message: "Admin not found",
        });

        const isPasswordValid = await admin.comparePassword(oldPassword);
        if (!isPasswordValid) return res.status(401).json({
            success: false,
            message: "Invalid old password",
        });

        admin.password = newPassword;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("changeAdminPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

module.exports = { changeAdminPassword };
