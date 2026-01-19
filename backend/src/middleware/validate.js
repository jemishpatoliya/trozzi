const { validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const errorMessages = errors.array().map(error => error.msg);

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    };
};

module.exports = validate;
