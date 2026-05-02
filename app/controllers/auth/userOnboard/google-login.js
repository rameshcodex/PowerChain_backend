const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../../../models/user");
const unVerifiedUsers = require("../../../models/unVerifiedUsers");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    console.log("Received Google login request:", req.body);
    const { credential, accessToken: googleAccessToken, email, name, googleId } = req.body;

    let userEmail, userName, userGoogleId;

    if (googleAccessToken) {
      console.log("Using access token flow");

      const userInfoResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      console.log("User info from Google:", userInfo);

      userEmail = userInfo.email;
      userName = userInfo.name;
      userGoogleId = userInfo.sub;
    }
    else if (credential) {
      console.log("Using credential-based flow");
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
      console.log("Using legacy userinfo-based flow");
      userEmail = email;
      userName = name;
      userGoogleId = googleId;
    } else {
      console.log("Invalid authentication data received");
      return res.status(400).json({ message: "Invalid authentication data" });
    }

    console.log("Looking for user with email:", userEmail);
    let user = await User.findOne({ email: userEmail });
    await unVerifiedUsers.findOneAndDelete({ email: userEmail });
    console.log("unVerifiedUsers deleted:", userEmail);
    if (!user) {
      console.log("Creating new user");
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

    } else {
      console.log("User found:", user._id);
    }


    // // 2FA CHECK (IMPORTANT PART)
    //       if (user.twoFAEnabled === true) {
    //           const tempToken = jwt.sign(
    //               { userId: user._id, twoFA: true },
    //               process.env.JWT_ACCESS_SECRET,
    //               { expiresIn: "5m" }
    //           );

    //           return res.status(200).json({
    //               success: true,
    //               twoFARequired: true,
    //               tempToken,
    //               message: "2FA required",
    //           });
    //       }

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

    console.log("Login successful, sending tokens");
    res.status(200).json({
      success: true,
      result: {
        accessToken,
        refreshToken
      },
      message: "Google login successful"
    });
  } catch (err) {
    console.error("Google authentication error:", err.message);
    console.error("Full error:", err);
    res.status(401).json({
      success: false,
      result: null,
      message: err.message || "Google authentication failed"
    });
  }
};
