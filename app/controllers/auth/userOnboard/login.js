const User = require("../../../models/user");
const bcrypt = require("bcryptjs");
const { matchedData } = require("express-validator");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");

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
        // const { email, password } = matchedData(req);

        // // 🔐 CAPTCHA CHECK (FIRST)
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
        });
        console.log("User found:", user);
        const unVerifiedUser = await unVerifiedUsers.findOne({
            $or: [
                { email: forCheck },
                { username: forCheck }
            ]
        });
        console.log("Unverified User found:", unVerifiedUser);

        console.log("unUserData:", unVerifiedUser);
        console.log("userData:", user);


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
                result: null,
                message: "user not found"
            });
        }

        if (user.fromGoogle === true && !user.password) {
            return res.status(400).json({
                success: false,
                result: null,
                message: "This account was created using Google. Please use Google login."
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
        // 2FA CHECK (IMPORTANT PART)
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

        const payload = { userId: user._id }

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
        return res.status(200).json({
            success: true,
            result: {
                accessToken,
                refreshToken
            },
            message: "Login successful"
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            result: null,
            message: error.message
        });
    }
}

module.exports = { login };