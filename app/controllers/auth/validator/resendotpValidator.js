const { check } = require("express-validator");
const { handleValidation } = require("../../../middleware/utils/handleValidation");

const resendotpValidator = [


  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 35 })
    .withMessage("Email must be less than 35 characters")
    .isEmail()
    .withMessage("Invalid email"),


  // ✅ CAPTCHA VALIDATION
  check("captcha")
    .notEmpty()
    .withMessage("Robot verification required"),

  (req, res, next) => {
    handleValidation(req, res, next);
  },
];

module.exports = { resendotpValidator };