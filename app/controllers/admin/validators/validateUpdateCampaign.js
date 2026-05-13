const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const validateUpdateCampaign = [

    check('content_id')
        .notEmpty()
        .withMessage("content_id is required")
        .trim()
        .isMongoId()
        .withMessage("Invalid content_id"),

    (req, res, next) => {
        handleValidation(req, res, next)
    }
];


module.exports = { validateUpdateCampaign };
