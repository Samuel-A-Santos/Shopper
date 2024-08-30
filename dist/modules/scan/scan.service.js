"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addScan = exports.updateConfirmedValue = exports.findMeasureUUID = exports.validateConfirmData = exports.validateUploadData = void 0;
const joi_1 = __importDefault(require("joi"));
let scans = [
    {
        image: "base64string1",
        // customer_code: "customer123",
        measure_datetime: "2024-08-01T12:00:00Z",
        measure_type: "WATER",
        measured_number: 1500,
        // confirmed_value: 1500,
        measure_uuid: "uuid-water-123"
    },
    {
        image: "base64string2",
        // customer_code: "customer123",
        measure_datetime: "2024-08-15T12:00:00Z",
        measure_type: "GAS",
        measured_number: 2500,
        // confirmed_value: undefined,
        measure_uuid: "uuid-gas-123"
    },
    {
        image: "base64string3",
        // customer_code: "customer456",
        measure_datetime: "2024-08-20T12:00:00Z",
        measure_type: "WATER",
        measured_number: 3500,
        // confirmed_value: 3500,
        measure_uuid: "uuid-water-456"
    }
];
const schema = joi_1.default.object({
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
const confirmSchema = joi_1.default.object({
    measure_uuid: joi_1.default.string().required().messages({
        "string.base": `"measure_uuid" must be a string`,
        "any.required": `"measure_uuid" is required`
    }),
    confirmed_value: joi_1.default.number().integer().required().messages({
        "number.base": `"confirmed_value" must be an integer`,
        "any.required": `"confirmed_value" is required`
    })
});
const validateUploadData = async (data) => {
    return schema.validateAsync(data);
};
exports.validateUploadData = validateUploadData;
const validateConfirmData = async (data) => {
    return confirmSchema.validateAsync(data);
};
exports.validateConfirmData = validateConfirmData;
const findMeasureUUID = async (db, measureUUID) => {
    return await db.collection('users').findOne({
        measure_uuid: measureUUID
    });
};
exports.findMeasureUUID = findMeasureUUID;
const updateConfirmedValue = async (db, uuid, confirmedValue) => {
    const users = db.collection('users');
    return await users.updateOne({ "scans.measure_uuid": uuid }, { $set: { "scans.$.confirmed_value": confirmedValue } });
};
exports.updateConfirmedValue = updateConfirmedValue;
// export const findExistingScan = (customer_code: string, measure_datetime: string): Scan | undefined => {
//     const measureDate = new Date(measure_datetime);
//     const month = measureDate.getMonth() + 1;
//     const year = measureDate.getFullYear();
//     return scans.find(scan =>
//         scan.customer_code === customer_code &&
//         typeof scan.measure_datetime === 'string' &&
//         new Date(scan.measure_datetime).getMonth() + 1 === month &&
//         new Date(scan.measure_datetime).getFullYear() === year
//     );
// };
const addScan = (scan) => {
    scans.push(scan);
};
exports.addScan = addScan;
// export const findScanByUUID = (measure_uuid: string): Scan | undefined => {
//     return scans.find(scan => scan.measure_uuid === measure_uuid);
// };
// export const updateConfirmedValue = (scan: Scan, confirmed_value: number) => {
//     scan.confirmed_value = confirmed_value;
// };
// export const filterScansByCustomerAndType = (customer_code: string, measure_type?: string): Scan[] => {
//     const validMeasureTypes = ["WATER", "GAS"];
//     if (measure_type && !validMeasureTypes.includes(measure_type.toUpperCase())) {
//         throw new Error("INVALID_TYPE");
//     }
//     return scans.filter(scan => {
//         const matchesCustomer = scan.customer_code === customer_code;
//         const matchesType = measure_type
//             ? scan.measure_type.toUpperCase() === measure_type.toUpperCase()
//             : true;
//         return matchesCustomer && matchesType;
//     });
// };
