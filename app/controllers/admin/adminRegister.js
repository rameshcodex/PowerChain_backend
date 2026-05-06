const Admin = require("../../models/admin")
const bcrypt = require("bcryptjs")
const { checkBodyString } = require("../../middleware/db");

const adminRegister = async (req, res) => {
  try {
    const name = checkBodyString(req, "name");
    const email = checkBodyString(req, "email");
    const password = checkBodyString(req, "password");

    const user = await Admin.findOne({ email })
    if (user) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User already exists",
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = new Admin({ name, email, password: hashedPassword })
    console.log(admin)
    await admin.save()
    const admin2 = admin.toJSON()
    delete admin2.password

    return res.status(201).json({
      success: true,
      result: admin2,
      message: "Admin registered successfully",
    })
  } catch (err) {
    console.error("Admin register error:", err)

    return res.status(500).json({
      success: false,
      result: null,
      message: "Failed to register admin",
    })
  }
}

module.exports = { adminRegister }
