const crypto = require("crypto");
const User = require("../../../models/user");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const axios = require("axios");



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
  console.log("FSDFDSFEWRew")
  try {

    const { email, captcha } = req.body;

    console.log("Received resend OTP request:", req.body);

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
        console.log("Captcha verification result:", isHuman);
        

        if (!isHuman) {
            return res.status(403).json({
                success: false,
                message: "Captcha verification failedxxxxxxxxxxxxx",
            });
        }

        const forCheck = email.trim()

    const user = await unVerifiedUsers.findOne({ email });
    const user1 = await User.findOne({ email });

    if (user1) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "User already verified"
      });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "Email not found"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // const hashedOtp = crypto
    //   .createHash("sha256")
    //   .update(otp)
    //   .digest("hex");

    // Update OTP & expiry
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // console.log("Resent OTP:", otp);
    // console.log("Email:", email);
    // console.log(user.name)
    checkedEmail = email
    username = user.name
    await sendOtpEmail({ checkedEmail, otp, username, temp: "resend" });


    res.status(200).json({
      success: true,
      result: null,
      message: "OTP resent successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      result: null,
      error: error.message
    });
  }
};

module.exports = { resendOtp };
