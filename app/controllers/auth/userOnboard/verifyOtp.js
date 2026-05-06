const User = require("../../../models/user");
const UnVerifiedUser = require("../../../models/unVerifiedUsers");
const { matchedData } = require("express-validator");
const { createItem } = require("../../../middleware/db");
const { handleError } = require("../../../middleware/utils");

const verifyOtp = async (req, res) => {
  try {
    const data = matchedData(req);
    const { email, otp } = data;
    
    const unverifiedUser = await UnVerifiedUser.findOne({ email }).select('+password');

    if (!unverifiedUser) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "Email not found"
      });
    }

    if (unverifiedUser.isVerified) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User already verified"
      });
    }

    if (unverifiedUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Invalid OTP. Please enter a valid OTP"
      });
    }

    if (unverifiedUser.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "OTP has expired. Please request a new OTP"
      });
    }

    const verifiedUser = await createItem({
      name: unverifiedUser.name,
      username: unverifiedUser.username,
      phone: unverifiedUser.phone,
      email: unverifiedUser.email,
      password: unverifiedUser.password,
      passwordSet: unverifiedUser.passwordSet,
      isVerified: true,
      otp: unverifiedUser.otp,
      otpExpires: unverifiedUser.otpExpires,
      kycStatus: unverifiedUser.kycStatus
    }, User);

    await UnVerifiedUser.findOneAndDelete({ email });

    return res.status(200).json({
      success: true,
      result: {
        id: verifiedUser._id,
        name: verifiedUser.name,
        email: verifiedUser.email
      },
      message: "OTP verified successfully"
    });

  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { verifyOtp };

