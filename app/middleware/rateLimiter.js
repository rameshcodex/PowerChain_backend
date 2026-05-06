const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many login attempts, please try again later." }
});

const tradeLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 1,
  message: { success: false, message: "Wait before placing another trade" }
});

const withdrawLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Wait before making another withdrawal request" }
});

module.exports = {
  loginLimiter,
  tradeLimiter,
  withdrawLimiter
};
