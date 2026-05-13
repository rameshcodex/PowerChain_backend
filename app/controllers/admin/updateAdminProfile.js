//PUT Update Admin Profile
const Admin = require("../../models/admin");

const updateAdminProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) return res.status(400).json({
            success: false,
            message: "Name, email and phone are required",
        });

        const admin = await Admin.findById(req?.user?._id);

        if (!admin) return res.status(404).json({
            success: false,
            message: "Admin not found",
        });

        admin.name = name;
        admin.email = email;
        admin.phone = phone;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Admin profile updated successfully",
        });
    } catch (error) {
        console.error("updateAdminProfile error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

module.exports = { updateAdminProfile };