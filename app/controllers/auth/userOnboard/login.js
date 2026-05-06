const User = require("../../../models/user");
const bcrypt = require("bcryptjs");
const { matchedData } = require("express-validator");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
// const { schedulePostLoginKycReminder } = require("../../../utils/kycNotificationService");

const unVerifiedUsers = require("../../../models/unVerifiedUsers");
const { handleError } = require("../../../middleware/utils");

const verifyToken = async (token) => {
    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: token,
                },
            }
        );
        return response.data.success === true;
    } catch {
        return false;
    }
};

const login = async (req, res) => {
    try {
        const { email, password, captcha } = matchedData(req);
        const deviceName = req.body.deviceName || req.body.deviceType || req.headers['user-agent'] || "Unknown device";
        const deviceIPAddress =
            (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').shift().trim()) ||
            req.socket?.remoteAddress ||
            req.ip ||
            null;

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

        const forCheck = email.trim()

        // 🔐 CAPTCHA CHECK (FIRST)
        // if (
        // !captcha ||
        // !req.session.captcha ||
        // captcha.toLowerCase() !== req.session.captcha.toLowerCase()
        // ) {
        // return res.status(400).json({
        //     success: false,
        //     result: null,
        //     message: "Invalid captcha"
        // })
        // }
        // const user = await User.findOne({
        //     $or: [
        //         { email: identifier },
        //         { name: identifier }
        //     ]
        // });
        // // clear captcha after validation
        // req.session.captcha = null


        const user = await User.findOne({
            $or: [
                { email: forCheck },
                { username: forCheck }
            ]
        }).select("+password");

        const unVerifiedUser = await unVerifiedUsers.findOne({
            $or: [
                { email: forCheck },
                { username: forCheck }
            ]
        });

        if (unVerifiedUser) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "User not verified"
            });
        }
        // if (!user.isVerified) {
        //     return res.status(400).json({
        //         success: false,
        //         result: null,
        //         message: "User not verified"
        //     });
        // }
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: "admin blocked your account"
            });
        }

        if (unVerifiedUser) {
            return res.status(400).json({
                success: false,
                message: "User not verified"
            });
        }

        if (user.fromGoogle === true) {
            return res.status(400).json({
                success: false,
                message: "This account was created using Google. Please use Google login."
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "Password missing. Please reset password."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "password is incorrect"
            });
        }

        user.deviceDetails = {
            deviceIPAddress,
            deviceType: deviceName,
        };
        await user.save();

        const checkedEmail = user.email;
        if (checkedEmail) {
            sendOtpEmail({
                checkedEmail,
                username: user.name || user.username,
                temp: "login_notification",
                subject: "Login Alert",
                deviceName,
                deviceIPAddress,
            }).catch((err) => {
                console.error("Failed to send login notification email:", err.message);
            });
        } else {
            console.warn("Login notification skipped: user has no email address");
        }

        // 2FA CHECK
        if (user.twoFAEnabled === true) {
            const tempToken = jwt.sign(
                { userId: user._id, twoFA: true },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: "5m" }
            );

            return res.status(200).json({
                success: true,
                twoFARequired: true,
                tempToken,
                message: "2FA required",
            });
        }

        const payload = { userId: user._id };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES }
        );

        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES }
        );

        // schedulePostLoginKycReminder(user._id);

        return res.status(200).json({
            success: true,
            result: {
                accessToken,
                refreshToken
            },
            message: "Login successful"
        });

    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { login };

