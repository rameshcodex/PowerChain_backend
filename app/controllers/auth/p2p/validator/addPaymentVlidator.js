const { check } = require('express-validator');
const { handleValidation } = require('../../../../middleware/utils/handleValidation');

const addPaymentMethodValidator = [
    check('type')
        .trim()
        .notEmpty()
        .withMessage('Payment method type is required')
        .isIn(['bank', 'upi'])
        .withMessage('Invalid payment method type. Supported: bank, upi'),

    // check('name')
    //     .trim()
    //     .notEmpty()
    //     .withMessage('Name is required'),

    check('bankName')
        .if((value, { req }) => req.body.type === 'bank')
        .trim()
        .notEmpty()
        .withMessage('Bank name is required for bank payment method'),

    check('ifsc')
        .if((value, { req }) => req.body.type === 'bank')
        .trim()
        .notEmpty()
        .withMessage('IFSC code is required for bank payment method'),

    check('accountNumber')
        .if((value, { req }) => req.body.type === 'bank')
        .trim()
        .notEmpty()
        .withMessage('Account number is required for bank payment method'),

    check('upiId')
        .if((value, { req }) => req.body.type === 'upi')
        .trim()
        .notEmpty()
        .withMessage('UPI ID is required'),

    check('accountType')
        .if((value, { req }) => ['bank'].includes(req.body.type))
        .trim()
        .notEmpty()
        .withMessage('Account type is required')
        .isIn(['savings', 'current'])
        .withMessage('Invalid account type'),

    check('bankBranch')
        .if((value, { req }) => ['bank', 'imps'].includes(req.body.type))
        .trim()
        .notEmpty()
        .withMessage('Bank branch is required'),

    // check('phoneNumber')
    //     .if((value, { req }) => req.body.type === 'paytm' || req.body.type === 'gpay')
    //     .trim()
    //     .notEmpty()
    //     .withMessage('Phone number is required')
    //     .isNumeric()
    //     .withMessage('Phone number must be numeric')
    //     .isLength({ min: 10, max: 15 })
    //     .withMessage('Phone number must be between 10 and 15 digits'),

    (req, res, next) => {
        handleValidation(req, res, next);
    }
];

module.exports = { addPaymentMethodValidator };
