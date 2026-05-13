const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

// CREATE
const addTemplateValidator = [
  check('template_name')
    .notEmpty().withMessage('Template Name is required'),

  check('html')
    .notEmpty().withMessage('HTML content is required'),

  check('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean'),

  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

const updateTemplateValidator = [
  check('template_name')
    .optional()
    .notEmpty().withMessage('Template Name is required'),

  check('html')
    .optional()
    .notEmpty().withMessage('HTML content is required'),

  check('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean'),

  (req, res, next) => {
    handleValidation(req, res, next)
  }
];

module.exports = {
  addTemplateValidator,
  updateTemplateValidator,
};