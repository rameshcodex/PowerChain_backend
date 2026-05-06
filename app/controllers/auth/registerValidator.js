const { check } = require('express-validator');
// const { isNumeric, isLength } = require('validator');
const {handleValidation} = require('../../middleware/utils/handleValidation');

const registerValidator = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email'),

  check('phone')
  .trim()
  .notEmpty()
  .withMessage('Phone is required')
  .bail()
  .isNumeric()
  .withMessage('Phone must be a number')
  .bail()
  .isLength({ min: 10, max: 10 })
  .withMessage('Phone must be 10 digits'),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

module.exports = { registerValidator };




