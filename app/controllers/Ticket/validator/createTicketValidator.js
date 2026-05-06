const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const createTicketValidator = [
    check('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),

    check('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Reason must be between 10 and 1000 characters'),

    (req, res, next) => {
        handleValidation(req, res, next)
    }
];

module.exports = { createTicketValidator };
