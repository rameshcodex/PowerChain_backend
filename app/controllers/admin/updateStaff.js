const Admin = require("../../models/admin");
const AdminRole = require("../../models/AdminRole");
const { canManageRole } = require("./adminPermission");

const updateStaff = async (req, res) => {
  try {

    const { name, staffId, email, phone, roleType, status } = req.body;

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
        message: "You cannot update this staff",
      });
    }

    if (email) {
      const emailExists = await Admin.findOne({
        _id: { $ne: staffId },
        email: email.toLowerCase(),
      });

      if (emailExists) {
        return res.code(400).send({
          success: false,
          message: "Email already exists",
        });
      }

      staff.email = email.toLowerCase();
    }

    if (roleType) {
      const roleData = await AdminRole.findOne({
        role_name: new RegExp(`^${roleType}$`, "i"),
        status: "active",
      });

      if (!roleData) {
        return res.code(404).send({
          success: false,
          message: "Role type not found or inactive",
        });
      }

      // keep system role fixed
      staff.role = "subadmin";
      staff.roleType = roleData.role_name;
      staff.permissions = roleData.permissions || [];
    }

    if (status !== undefined) {
      staff.status = status;
    }

    if (name !== undefined) staff.name = name;
    if (phone !== undefined) staff.phone = phone;

    await staff.save();

    return res.send({
      success: true,
      message: "Staff updated successfully",
      result: staff,
    });
  } catch (error) {
    console.error("updateStaff error:", error);
    return res.code(500).send({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { updateStaff };