const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../../../models/user");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");
const { sendOtpEmail } = require("../helpers.js/sendOtpEmail");
const { handleError } = require("../../../middleware/utils");
const { getChannel } = require('../../../helper/rabbitmq')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { credential, accessToken: googleAccessToken, email, name, googleId } = req.body;

    const deviceName = req.body.deviceName || req.body.deviceType || req.headers['user-agent'] || "Unknown device";
    const deviceIPAddress =
      (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').shift().trim()) ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;

    let userEmail, userName, userGoogleId;

    if (googleAccessToken) {
      const userInfoResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      userEmail = userInfo.email;
      userName = userInfo.name;
      userGoogleId = userInfo.sub;
    }
    else if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      userEmail = payload.email;
      userName = payload.name;
      userGoogleId = payload.sub;
    }
    else if (email && name && googleId) {
      userEmail = email;
      userName = name;
      userGoogleId = googleId;
    } else {
      return res.status(400).json({ message: "Invalid authentication data" });
    }

    let user = await User.findOne({ email: userEmail });

    if (user && user.status === "false") {
      return res.status(403).json({ message: "Admin Blocked Your Account" });
    }

    await unVerifiedUsers.findOneAndDelete({ email: userEmail });

    if (!user) {
      user = await User.create({
        name: userName,
        username: "",
        email: userEmail,
        password: "",
        phone: "",
        googleId: userGoogleId,
        provider: "google",
        fromGoogle: true,
        isVerified: true,
      });

    }

    user.deviceDetails = {
      deviceIPAddress,
      deviceType: deviceName,
    };

    console.log(user, "users")
    await user.save();

    // var channel = await getChannel();
    // var message = {
    //   userId: user?._id?.toString(),
    //   category: 'SECURITY',
    //   eventType: 'LOGIN',
    //   title: 'Login Alert',
    //   message: `Your account was logged in successfully from ${deviceName}. IP address: ${deviceIPAddress}`,
    //   referenceId: user?._id.toString(),
    //   priority: 'MEDIUM',
    //   data: {
    //     username: userName,
    //     email: userEmail,
    //     deviceName: deviceName,
    //     deviceIPAddress: deviceIPAddress,
    //     loggedInAt: new Date().toISOString()
    //   }
    // }
    // console.log(message, "messagesd")
    // channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(message)), {
    //   persistent: true
    // })

    const checkedEmail = user.email;
    if (checkedEmail) {
      // sendOtpEmail({
      //   checkedEmail,
      //   username: user.name || user.username,
      //   temp: "login_notification",
      //   subject: "Login Alert",
      //   deviceName,
      //   deviceIPAddress,
      // }).catch((err) => {
      //   console.error("Failed to send Google login notification email:", err.message);
      // });
    } else {
      console.warn("Google login notification skipped: user has no email address");
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

    res.status(200).json({
      success: true,
      result: {
        accessToken,
        refreshToken
      },
      message: "Google login successful"
    });
  } catch (error) {
    console.log(error, "errorerror")
    handleError(res, error);
  }
};
