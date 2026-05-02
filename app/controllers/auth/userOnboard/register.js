const bcrypt = require("bcryptjs");
const axios = require("axios");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const { matchedData } = require("express-validator");
const User = require("../../../models/user");

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

const register = async (req, res) => {
    try {
        req = matchedData(req);
        const { name, email, password, phone, username, captcha } = req;

        // 🔐 CAPTCHA CHECK (same as login)
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

        const checkedEmail = email.toLowerCase().trim();
        const checkedName = username.trim();

        const [verifiedUser, unverifiedUser] = await Promise.all([
            User.findOne({
                $or: [
                    { email: checkedEmail },
                    { username: checkedName },
                    { phone: phone }
                ]
            }),
            unVerifiedUsers.findOne({
                $or: [
                    { email: checkedEmail },
                    { username: checkedName },
                    { phone: phone }
                ]
            })
        ]);

        if (
            verifiedUser?.username === checkedName ||
            unverifiedUser?.username === checkedName
        ) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Username already registered"
            });
        }

        if (
            verifiedUser?.email === checkedEmail ||
            unverifiedUser?.email === checkedEmail
        ) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Email already registered"
            });
        }

        if (
            verifiedUser?.phone === phone ||
            unverifiedUser?.phone === phone
        ) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "Phone number already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();


      console.log("UNVERIFIED OTP", "", otp);
        await unVerifiedUsers.create({
            name: name,
            username: checkedName,
            email: checkedEmail,
            phone: phone,
            password: hashedPassword,
            otp,
            otpExpires: Date.now() + 5 * 60 * 1000,
            isVerified: false
        });

        // await sendOtpEmail({
        //     checkedEmail,
        //     otp,
        //     username: checkedName,
        //     temp: "register"
        // });

        return res.status(201).json({
            success: true,
            result: null,
            message: "OTP sent to email"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            result: null,
            message: "Registration failed"
        });
    }
};

module.exports = { register };