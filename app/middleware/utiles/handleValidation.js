const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      result: null,
      message: errors.array()[0].msg  
    });
  }

  next();
};

module.exports = { handleValidation };
