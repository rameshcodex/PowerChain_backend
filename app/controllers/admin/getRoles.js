const AdminRole = require("../../models/AdminRole");

const getRoles = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    if (search) {
      filter.$or = [
        { role_name: { $regex: search, $options: "i" } },
      ];
    }

    const [roles, total] = await Promise.all([
      AdminRole.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)              // ✅ pagination
        .limit(limitNumber)      // ✅ pagination
        .lean(),

      AdminRole.countDocuments(filter), // ✅ total count
    ]);

    return res.send({
      success: true,
      message: "Roles fetched successfully",
      result: roles,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    });

  } catch (error) {
    console.error("getRoles error:", error);
    return res.code(500).send({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getRoles };