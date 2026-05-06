const { matchedData } = require("express-validator");
const User = require("../../../models/user");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const { handleError } = require("../../../middleware/utils");

const forgetPassword = async (req, res) => {
  try {
    const data = matchedData(req);
    const { email } = data;

    const user = await User.findOne({ email });
    const unVerifiedUser = await unVerifiedUsers.findOne({ email });

    if (!user && unVerifiedUser) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Email not verified. Please verify your email first"
      });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "Email not found"
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        result: null,
        message: "You signed up with Google. Please log in using Google and set a password in your profile."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();
    
    await sendOtpEmail({ 
        checkedEmail: user.email, 
        otp, 
        temp: "forgotpassword", 
        username: user.name 
    });

    return res.status(200).json({
      success: true,
      result: null,
      message: "OTP sent successfully"
    });

  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { forgetPassword };

