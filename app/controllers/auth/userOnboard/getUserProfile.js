const User = require("../../../models/user");

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    const user = await User.findById(userId).select("+password -otp -otpExpires -__v").lean();

    console.log("User profile data:", user);
    const isPassword = user.password ? true : false;
    console.log(isPassword, "PPPPPPPOOO");

    delete user.password;
    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "User not found"
      });
    }
    return res.status(200).json({
      success: true,
      result: { ...user, isPassword },
      message: "Profile fetched successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      result: null,
      message: "Failed to fetch profile"
    });
  }
};

module.exports = { getUserProfile };
