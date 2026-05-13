const Admin = require("../../models/admin");
const { canManageRole } = require("./adminPermission");

const updateStaffStatus = async (req, res) => {
  try {
    const { staffId, status } = req.body;

    const staff = await Admin.findById(staffId);

    if (!staff) {
      return res.code(404).send({
        success: false,
        message: "Staff not found",
      });
    }

    if (!canManageRole(req.user.role, staff.role)) {
      return res.code(403).send({
        success: false,
        message: "You cannot change this staff status",
      });
    }

    staff.status = status;
    await staff.save();

    return res.send({
      success: true,
      message: "Staff status updated successfully",
      result: staff,
    });
  } catch (error) {
    console.error("updateStaffStatus error:", error);
    return res.code(500).send({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { updateStaffStatus };