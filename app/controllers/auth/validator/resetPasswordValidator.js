const { check } = require('express-validator');
// const { isNumeric, isLength } = require('validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const resetPasswordValidator = [


  check('oldPassword')
    .optional(),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage(
      'Password must contain upper, lower, number and special characters'
    ),




  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

module.exports = { resetPasswordValidator };




