const AdminRole = require("../../models/AdminRole");

const createRole = async (req, res) => {
  try {
    const { role_name, permissions } = req.body;

    const normalizedRoleName = role_name.trim().toLowerCase();

    if (req.user.role !== "admin") {
      return res.code(403).send({
        success: false,
        message: "Only admin can create roles",
      });
    }

    const existingRole = await AdminRole.findOne({ role_name: normalizedRoleName });

    if (existingRole) {
      return res.code(400).send({
        success: false,
        message: "Role already exists",
      });
    }

    const cleanedPermissions = [...new Set(
      permissions.map((item) => item.trim()).filter(Boolean)
    )];

    const role = await AdminRole.create({
      role_name: normalizedRoleName,
      permissions: cleanedPermissions,
      createdBy: req.user._id,
    });

    return res.send({
      success: true,
      message: "Role created successfully",
      result: role,
    });
  } catch (error) {
    console.error("createRole error:", error);
    return res.code(500).send({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { createRole };