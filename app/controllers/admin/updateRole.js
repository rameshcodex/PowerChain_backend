const AdminRole = require("../../models/AdminRole");
const Admin = require("../../models/admin");

const updateRole = async (req, res) => {
  try {
    const { roleId, role_name, permissions, status } = req.body;

    const role = await AdminRole.findById(roleId);

    if (!role) {
      return res.code(404).send({
        success: false,
        message: "Role not found",
      });
    }

    // keep old role name before update
    const oldRoleName = role.role_name;

    if (role_name !== undefined) {
      role.role_name = role_name.trim();
    }

    if (permissions !== undefined) {
      role.permissions = permissions;
    }

    if (status !== undefined) {
      role.status = status;
    }

    await role.save();

    // sync all staff with same roleType
    await Admin.updateMany(
      {
        roleType: { $in: [oldRoleName, role.role_name] }
      },
      {
        $set: {
          role: "subadmin",
          roleType: role.role_name,
          permissions: role.permissions || [],
        }
      }
    );

    return res.send({
      success: true,
      message: "Role updated and staff permissions synced successfully",
      result: role,
    });
  } catch (error) {
    console.error("updateRole error:", error);
    return res.code(500).send({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { updateRole };