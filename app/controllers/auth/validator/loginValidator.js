const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const loginValidator = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
    

  // check('identifier')
  //   .trim()
  //   .notEmpty()
  //   .withMessage('Name is required'),

  check('password')
    .notEmpty()
    .withMessage('Password is required'),

  check("captcha").notEmpty().withMessage("Captcha is required"),

    (req, res, next) => {
  handleValidation(req, res, next)
}
];

module.exports = { loginValidator };




