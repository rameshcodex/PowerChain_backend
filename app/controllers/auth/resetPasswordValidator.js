const { check } = require('express-validator');
// const { isNumeric, isLength } = require('validator');
const {handleValidation} = require('../../middleware/utiles/handleValidation');

const registerValidator = [

  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email'),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  check('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isNumeric()
    .withMessage('OTP must be a number')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),

  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

module.exports = { registerValidator };




