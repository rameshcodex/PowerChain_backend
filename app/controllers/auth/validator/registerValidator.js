const { check } = require("express-validator");
const { handleValidation } = require("../../../middleware/utils/handleValidation");

const registerValidator = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Name can contain only letters and numbers")
    .isLength({ min: 3, max: 25 })
    .withMessage("Name must be between 3 and 25 characters"),

  check("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Username can contain only letters and numbers")
    .isLength({ min: 3, max: 25 })
    .withMessage("Username must be between 3 and 25 characters"),

  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 35 })
    .withMessage("Email must be less than 35 characters")
    .isEmail()
    .withMessage("Invalid email"),

  check("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .bail()
    .isNumeric()
    .withMessage("Phone must be a number")
    .bail()
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone must be 10 digits"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage(
      "Password must contain upper, lower, number and special characters"
    ),

  // ✅ CAPTCHA VALIDATION
  check("captcha")
    .notEmpty()
    .withMessage("Robot verification required"),

  (req, res, next) => {
    handleValidation(req, res, next);
  },
];

module.exports = { registerValidator };