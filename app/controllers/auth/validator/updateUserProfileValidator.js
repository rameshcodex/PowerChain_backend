
const { check } = require('express-validator');
// const { isNumeric, isLength } = require('validator');
const { handleValidation } = require('../../../middleware/utiles/handleValidation');

const updateUserProfileValidator = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Name can not be empty')
        .isLength({ min: 3, max: 25 })
        .withMessage('Name must be between 3 and 25 characters'),

    // check('username')
    //     .trim()
    //     .notEmpty()
    //     .withMessage('Username can not be empty')
    //     .matches(/^[a-zA-Z0-9]+$/)
    //     .withMessage('Username can contain only letters and numbers')
    //     .isLength({ min: 3, max: 25 })
    //     .withMessage('Username must be between 3 and 25 characters'),


    check('email')
        .trim()
        .notEmpty()
        .withMessage('Email can not be empty')
        .isLength({ max: 35 })
        .withMessage('Email must be less than 35 characters')
        .isEmail()
        .withMessage('Invalid email'),

    check('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone can not be empty')
        .bail()
        .isNumeric()
        .withMessage('Phone must be a number')
        .bail()
        .isLength({ min: 10, max: 10 })
        .withMessage('Phone must be 10 digits'),

    check('country')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Country must be less than 50 characters'),

    check('telegramId')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Telegram ID must be less than 50 characters'),

    check('telegramUsername')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Telegram Username must be less than 50 characters'),

    // check('password')
    //     .notEmpty()
    //     .withMessage('Password is required')
    //     .isLength({ min: 6 })
    //     .withMessage('Password must be at least 6 characters')
    //     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    //     .withMessage(
    //         'Password must contain upper, lower, number and special characters'
    //     ),


    (req, res, next) => {
        handleValidation(req, res, next)
    }
];

module.exports = { updateUserProfileValidator };




