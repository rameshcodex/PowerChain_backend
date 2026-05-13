const { listInitOptions } = require("../../middleware/db");
const Admin = require("../../models/admin");
const { canonicalRoleName } = require("./adminPermission");

const getStaffList = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
    } = req.query;

    const options = listInitOptions(req);
    options.select = "name email phone role roleType permissions status createdAt updatedAt";

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const loggedInRole = canonicalRoleName(req.user.role);

    const staffList = await Admin.paginate(filter, options);

    return res.status(200).json({
      success: true,
      message: "Staff list fetched successfully",
      result: staffList,
    });
  } catch (error) {
    console.error("getStaffList error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getStaffList };