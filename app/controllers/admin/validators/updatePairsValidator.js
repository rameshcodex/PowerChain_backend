const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const updatePairsValidator = [
    //if value present only true or false
    check('status')
        .optional()
        .isBoolean()
        .withMessage('Invalid status'),

    check('baseAssetPrecision')
        .optional(),

    check('quoteAssetPrecision')
        .optional(),

    check('minPrice')
        .optional(),

    check('maxPrice')
        .optional(),

    check('tickSize')
        .optional(),

    check('stepSize')
        .optional(),

    check('minQty')
        .optional(),

    check('maxQty')
        .optional(),

    check('minNotional')
        .optional(),

    check('maxNotional')
        .optional(),

    check('buyCommission')
        .optional(),

    check('sellCommission')
        .optional(),


    (req, res, next) => {
        handleValidation(req, res, next)
    }
];

module.exports = { updatePairsValidator };