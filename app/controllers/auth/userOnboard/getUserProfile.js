const User = require("../../../models/user");
const { handleError } = require("../../../middleware/utils");

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // We use direct mongoose here to include the password field for the password check logic
    const user = await User.findById(userId).select("+password -otp -otpExpires -__v").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "User not found"
      });
    }

    const isPassword = !!user.password;
    delete user.password;

    return res.status(200).json({
      success: true,
      result: { ...user, isPassword },
      message: "Profile fetched successfully"
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getUserProfile };

