const Admin = require("../../models/admin");

//GET Get admin profile

const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Admin profile fetched successfully",
            result: admin
        });
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin profile"
        });
    }
}

module.exports = { getAdminProfile };
