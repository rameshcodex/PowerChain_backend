const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const { refreshToken } = require("../../controllers/auth/userOnboard/refreshToken");

const tokenValidator = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        result: null,
        message: "Token missing"
      });
    }
    // console.log(authHeader,"token");


    const token = authHeader.split(" ")[1];

    // console.log(token,"aploted");


    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        result: null,
        message: "User no longer exists"
      });
    }

    // const token2 = refreshToken()

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      result: null,
      message: "Invalid or expired token"
    });
  }
};

module.exports = { tokenValidator };
