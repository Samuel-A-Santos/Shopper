"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmSchema = exports.ScanSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.ScanSchema = joi_1.default.object({
    image: joi_1.default.string().base64().required().messages({
        "string.base64": `"image" must be a valid Base64 encoded string`
    }),
    customer_code: joi_1.default.string().required().messages({
        "string.base": `"customer_code" must be a string`
    }),
    measure_datetime: joi_1.default.date().iso().required().messages({
        "date.base": `"measure_datetime" must be a valid date`,
        "date.format": `"measure_datetime" is not in the correct format`
    }),
    measure_type: joi_1.default.string().valid("WATER", "GAS").required().messages({
        "any.only": `"measure_type" must be either "WATER" or "GAS"`,
        "string.base": `"measure_type" must be a string`
    })
});
exports.ConfirmSchema = joi_1.default.object({
    measure_uuid: joi_1.default.string().required().messages({
        "string.base": `"measure_uuid" must be a string`,
        "any.required": `"measure_uuid" is required`
    }),
    confirmed_value: joi_1.default.number().integer().required().messages({
        "number.base": `"confirmed_value" must be an integer`,
        "any.required": `"confirmed_value" is required`
    })
});
