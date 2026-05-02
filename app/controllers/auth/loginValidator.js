const { check } = require('express-validator');
// const { isNumeric, isLength } = require('validator');
const {handleValidation} = require('../../middleware/utiles/handleValidation');

const loginValidator = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email'),

  check('password')
    .notEmpty()
    .withMessage('Password is required'),

  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

module.exports = { loginValidator };




