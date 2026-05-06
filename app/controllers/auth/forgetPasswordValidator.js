const { check } = require('express-validator');
// const { isNumeric, isLength } = require('validator');
const {handleValidation} = require('../../middleware/utils/handleValidation');

const forgetPasswordValidator = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email'),

  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

module.exports = { forgetPasswordValidator };




