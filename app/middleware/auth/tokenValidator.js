const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const Admin = require("../../models/admin");


const extractBearer = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== "string") return null;
  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1].trim();
  }
  return null;
};

const tokenValidator = async (req, res, next) => {
  try {
    const token = extractBearer(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        result: null,
        message: "Token missing — send Authorization: Bearer <accessToken> from login (not refresh token)",
      });
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        result: null,
        message: "Server misconfiguration: JWT_ACCESS_SECRET is not set",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (decoded.twoFA === true) {
      return res.status(401).json({
        success: false,
        result: null,
        message: "Complete 2FA with POST /api/login/2fa-verify before calling this endpoint",
      });
    }


    let account = await User.findById(decoded.userId);
    if (!account) {
      account = await Admin.findById(decoded.userId);
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        result: null,
        message: "Account no longer exists",
      });
    }

    req.user = account;
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
