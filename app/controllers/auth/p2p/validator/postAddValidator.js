const { check } = require("express-validator");
const { handleValidation } = require("../../../../middleware/utiles/handleValidation");

const postAddValidator = [

  check("side")
    .trim()
    .notEmpty()
    .withMessage("Side is required")
    .isIn(["buy", "sell"])
    .withMessage("Side must be buy or sell"),

  check("fiat")
    .trim()
    .notEmpty()
    .withMessage("Fiat currency is required"),

  check("crypto")
    .trim()
    .notEmpty()
    .withMessage("Crypto asset is required"),

  check("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0"),

  check("volume")
    .notEmpty()
    .withMessage("Volume is required")
    .isFloat({ gt: 0 })
    .withMessage("Volume must be greater than 0"),

  check("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min price must be >= 0"),

  check("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max price must be >= 0"),

  check("timeLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Time limit must be at least 1 minute"),

  check("paymentMethod")
    .isArray({ min: 1 })
    .withMessage("At least one payment method is required"),

  check("paymentMethod.*")
    .isMongoId()
    .withMessage("Invalid payment method ID"),

  (req, res, next) => handleValidation(req, res, next),
];

module.exports = { postAddValidator };
