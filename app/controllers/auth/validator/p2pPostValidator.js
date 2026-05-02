const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utiles/handleValidation');

const createP2PPostValidator = [
    check('side')
        .trim()
        .notEmpty()
        .withMessage('Side is required')
        .isIn(['buy', 'sell'])
        .withMessage('Side must be either "buy" or "sell"'),

    check('fiat')
        .trim()
        .notEmpty()
        .withMessage('Fiat currency is required')
        .isString()
        .withMessage('Fiat must be a string'),

    check('crypto')
        .trim()
        .notEmpty()
        .withMessage('Crypto currency is required')
        .isString()
        .withMessage('Crypto must be a string'),

    check('price')
        .notEmpty()
        .withMessage('Price is required')
        .isNumeric()
        .withMessage('Price must be a number')
        .toFloat(),

    check('volume')
        .notEmpty()
        .withMessage('Volume is required')
        .isNumeric()
        .withMessage('Volume must be a number')
        .toFloat(),

    check('minPrice')
        .optional()
        .isNumeric()
        .withMessage('Min Price must be a number')
        .toFloat(),

    check('maxPrice')
        .optional()
        .isNumeric()
        .withMessage('Max Price must be a number')
        .toFloat(),

    check('paymentMethod')
        .notEmpty()
        .withMessage('Payment method is required')
        .isArray({ min: 1 })
        .withMessage('Payment method must be a non-empty array'),

    check('paymentMethod.*')
        .isMongoId()
        .withMessage('Invalid payment method ID'),

    (req, res, next) => {
        handleValidation(req, res, next);
    }
];

module.exports = { createP2PPostValidator };
