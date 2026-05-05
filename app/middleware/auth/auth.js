const jwt = require("jsonwebtoken");
const User = require("../../models/user");

/**
 * Usage:
 * auth() → only token check
 * auth("admin") → only admin
 * auth(["admin", "user"]) → multiple roles allowed
 */
const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      // 🔒 Check token presence
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          result: null,
          message: "Token missing",
        });
      }

      const token = authHeader.split(" ")[1];

      // 🔑 Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          result: null,
          message: "Invalid or expired token",
        });
      }

      // 👤 Get user
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          result: null,
          message: "User not found",
        });
      }

      // 🎭 Role check (if roles passed)
      if (roles.length > 0) {
        const hasRole = Array.isArray(roles)
          ? roles.includes(user.role)
          : user.role === roles;

        if (!hasRole) {
          return res.status(403).json({
            success: false,
            result: null,
            message: "Forbidden: You don't have access",
          });
        }
      }

      // ✅ Attach user
      req.user = user;

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(500).json({
        success: false,
        result: null,
        message: "Server error",
      });
    }
  };
};

module.exports = auth;