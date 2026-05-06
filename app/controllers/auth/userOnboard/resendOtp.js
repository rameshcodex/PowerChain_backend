const crypto = require("crypto");
const User = require("../../../models/user");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const axios = require("axios");
const { handleError } = require("../../../middleware/utils");

const verifyToken = async (token) => {
    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            new URLSearchParams({
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: token,
            })
        );
        return response.data.success === true;
    } catch {
        return false;
    }
};

const resendOtp = async (req, res) => {
  try {
    const { email, captcha } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!captcha) {
        return res.status(400).json({
            success: false,
            message: "Robot verification required",
        });
    }

    const isHuman = await verifyToken(captcha);
    
    if (!isHuman) {
        return res.status(403).json({
            success: false,
            message: "Captcha verification failed",
        });
    }

    const forCheck = email.trim();

    const [unverifiedUser, user] = await Promise.all([
        unVerifiedUsers.findOne({ email: forCheck }),
        User.findOne({ email: forCheck })
    ]);

    if (user) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User already verified"
      });
    }

    if (!unverifiedUser) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "Email not found"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    unverifiedUser.otp = otp;
    unverifiedUser.otpExpires = Date.now() + 5 * 60 * 1000;
    await unverifiedUser.save();

    await sendOtpEmail({ 
        checkedEmail: email, 
        otp, 
        username: unverifiedUser.name, 
        temp: "resend" 
    });

    res.status(200).json({
      success: true,
      result: null,
      message: "OTP resent successfully"
    });

  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { resendOtp };

