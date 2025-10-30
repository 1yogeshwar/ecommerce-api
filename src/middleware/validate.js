const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        if (!schema || typeof schema.validate !== 'function') {
            throw new Error('A valid Joi schema must be provided');
        }

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }
        next();
    };
};

module.exports = validate;
