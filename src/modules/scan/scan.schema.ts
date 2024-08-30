import Joi from 'joi';

export const ScanSchema = Joi.object({
    image: Joi.string().base64().required().messages({
        "string.base64": `"image" must be a valid Base64 encoded string`
    }),
    customer_code: Joi.string().required().messages({
        "string.base": `"customer_code" must be a string`
    }),
    measure_datetime: Joi.date().iso().required().messages({
        "date.base": `"measure_datetime" must be a valid date`,
        "date.format": `"measure_datetime" is not in the correct format`
    }),
    measure_type: Joi.string().valid("WATER", "GAS").required().messages({
        "any.only": `"measure_type" must be either "WATER" or "GAS"`,
        "string.base": `"measure_type" must be a string`
    })
});

export const ConfirmSchema = Joi.object({
    measure_uuid: Joi.string().required().messages({
        "string.base": `"measure_uuid" must be a string`,
        "any.required": `"measure_uuid" is required`
    }),
    confirmed_value: Joi.number().integer().required().messages({
        "number.base": `"confirmed_value" must be an integer`,
        "any.required": `"confirmed_value" is required`
    })
});