const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../../../models/user");
const jwt = require("jsonwebtoken");
const { sendNotification } = require("../../../utils/notificationHelper");
const { schedulePostLoginKycReminder } = require("../../../utils/kycNotificationService");
const { logger } = require("../../../../winston");
const { handleError } = require("../../../middleware/utils");

const setUpTwoFA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.twoFAEnabled === true) {
      return res.status(400).json({
        success: false,
        message: "2FA already enabled",
      });
    }

    let base32Secret;
    const issuer = "DemoExchange";
    const label = `${issuer}:${user.email}`;

    if (user.twoFASecret && user.twoFAEnabled === false) {
      base32Secret = user.twoFASecret;
    } else {
      const generated = speakeasy.generateSecret({
        length: 20,
        name: label,
        issuer: issuer,
      });

      base32Secret = generated.base32;
      user.twoFASecret = base32Secret;
      user.twoFAEnabled = false;
      await user.save();
    }

    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(user.email);
    const otpauth_url = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${base32Secret}&issuer=${encodedIssuer}`;

    const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);

    return res.status(200).json({
      success: true,
      result: {
        qrCode: qrCodeDataURL,
        otpauth_url: otpauth_url,
        manualCode: base32Secret,
      },
      message: "2FA setup initiated",
    });
  } catch (error) {
    handleError(res, error);
  }
};

const verifyTwoFA = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFASecret,
      encoding: "base32",
      token: String(otp),
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    req.user.twoFAEnabled = true;
    await req.user.save();

    const Title = "2FA Enabled";
    const message = `Your 2FA has been enabled successfully.`;
    await sendNotification({
      userId: req.user._id,
      type: "user",
      event: "2fa_enabled",
      title: Title,
      message: message,
    });
    logger.notification(`Sending notification to user ${req.user._id}: ${Title} - ${message}`);

    return res.status(200).json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

const loginTwoFAVerify = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFASecret,
      encoding: "base32",
      token: String(otp),
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const payload = { userId: req.user._id };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    });

    schedulePostLoginKycReminder(req.user._id);

    return res.status(200).json({
      success: true,
      result: {
        accessToken,
        refreshToken,
      },
      message: "2FA verified successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

const disableTwoFA = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    if (!req.user.twoFAEnabled || !req.user.twoFASecret) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFASecret,
      encoding: "base32",
      token: String(otp),
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    req.user.twoFAEnabled = false;
    await req.user.save();

    const Title = "2FA Disabled";
    const message = `Your 2FA has been disabled successfully.`;
    await sendNotification({
      userId: req.user._id,
      type: "user",
      event: "2fa_disabled",
      title: Title,
      message: message,
    });
    logger.notification(`Sending notification to user ${req.user._id}: ${Title} - ${message}`);

    return res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  setUpTwoFA,
  verifyTwoFA,
  loginTwoFAVerify,
  disableTwoFA,
};
