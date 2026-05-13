const { check } = require('express-validator');
const { handleValidation } = require('../../../middleware/utils/handleValidation');

const validateCreateCampaign = [

    check('content_id')
        .notEmpty()
        .withMessage("content_id is required")
        .trim()
        .isMongoId()
        .withMessage("Invalid content_id"),

    check('campaign_name')
        .notEmpty()
        .withMessage("campaign_name is required")
        .trim()
        .isLength({ min: 1 })
        .withMessage("campaign_name cannot be empty"),

    (req, res, next) => {
        handleValidation(req, res, next)
    }
];


module.exports = { validateCreateCampaign };
