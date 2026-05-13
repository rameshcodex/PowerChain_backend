const bcrypt = require("bcrypt");
const Admin = require("../../models/admin");
const AdminRole = require("../../models/AdminRole");

const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role, roleType } = req.body;

    const systemRole = role;

    if (systemRole !== "subadmin") {
      return res.code(400).send({
        success: false,
        message: "Role must be subadmin",
      });
    }

    const existingUser = await Admin.findOne({
      $or: [
        { email: email.toLowerCase() },
        { name: name.toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.code(400).send({
        success: false,
        message: "Email or name already exists",
      });
    }

    const roleData = await AdminRole.findOne({
      role_name: new RegExp(`^${roleType}$`, "i"),
      status: "active",
    });

    if (!roleData) {
      return res.code(404).send({
        success: false,
        message: "Selected role type not found or inactive",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await Admin.create({
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      password: hashedPassword,
      role: systemRole,
      roleType,
      permissions: roleData.permissions || [],
      createdBy: req.user._id,
    });

    return res.send({
      success: true,
      message: "Staff created successfully",
      result: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        roleType: newStaff.roleType,
        permissions: newStaff.permissions,
        status: newStaff.status,
      },
    });
  } catch (error) {
    console.error("createStaff error:", error);
    return res.code(500).send({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { createStaff };