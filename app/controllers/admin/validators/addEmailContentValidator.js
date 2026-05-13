const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const addEmailContentValidator = [

    check('event_key')
        .notEmpty().withMessage('Event Key is required'),

    check('subject')
        .notEmpty().withMessage('Subject is required'),

    check('body')
        .notEmpty().withMessage('Body is required'),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean'),

    check('template_name')
        .notEmpty().withMessage('Template Name is required'),

    (req, res, next) => {
        handleValidation(req, res, next)
    }
];

module.exports = { addEmailContentValidator };
