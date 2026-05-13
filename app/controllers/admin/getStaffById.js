const Admin = require("../../models/admin");

const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({
      success: false,
      message: "Staff ID is required",
    });

    const staff = await Admin.findById(id);

    if (!staff) return res.status(404).json({
      success: false,
      message: "Staff not found",
    });

    return res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      result: staff,
    });
  } catch (error) {
    console.error("getStaffById error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getStaffById };