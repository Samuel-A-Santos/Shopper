import { Scan } from "./scan.types";
import Joi from "joi";

let scans: Scan[] = [
  {
    image: "base64string1",
    customer_code: "customer123",
    measure_datetime: "2024-08-01T12:00:00Z",
    measure_type: "WATER",
    measured_number: 1500,
    confirmed_value: 1500,
    measure_uuid: "uuid-water-123",
  },
  {
    image: "base64string2",
    customer_code: "customer123",
    measure_datetime: "2024-08-15T12:00:00Z",
    measure_type: "GAS",
    measured_number: 2500,
    confirmed_value: 0,
    measure_uuid: "uuid-gas-123",
  },
  {
    image: "base64string3",
    customer_code: "customer456",
    measure_datetime: "2024-08-20T12:00:00Z",
    measure_type: "WATER",
    measured_number: 3500,
    confirmed_value: 3500,
    measure_uuid: "uuid-water-456",
  },
];

const schema = Joi.object({
  image: Joi.string().base64().required().messages({
    "string.base64": `"image" must be a valid Base64 encoded string`,
  }),
  customer_code: Joi.string().required().messages({
    "string.base": `"customer_code" must be a string`,
  }),
  measure_datetime: Joi.date().iso().required().messages({
    "date.base": `"measure_datetime" must be a valid date`,
    "date.format": `"measure_datetime" is not in the correct format`,
  }),
  measure_type: Joi.string().valid("WATER", "GAS").required().messages({
    "any.only": `"measure_type" must be either "WATER" or "GAS"`,
    "string.base": `"measure_type" must be a string`,
  }),
});

const confirmSchema = Joi.object({
  measure_uuid: Joi.string().required().messages({
    "string.base": `"measure_uuid" must be a string`,
    "any.required": `"measure_uuid" is required`,
  }),
  confirmed_value: Joi.number().integer().required().messages({
    "number.base": `"confirmed_value" must be an integer`,
    "any.required": `"confirmed_value" is required`,
  }),
});

export const validateUploadData = async (data: any) => {
  return schema.validateAsync(data);
};

export const validateConfirmData = async (data: any) => {
  return confirmSchema.validateAsync(data);
};

export const findExistingScan = (
  customer_code: string,
  measure_datetime: string
): Scan | undefined => {
  const measureDate = new Date(measure_datetime);
  const month = measureDate.getMonth() + 1;
  const year = measureDate.getFullYear();

  return scans.find(
    (scan) =>
      scan.customer_code === customer_code &&
      typeof scan.measure_datetime === "string" &&
      new Date(scan.measure_datetime).getMonth() + 1 === month &&
      new Date(scan.measure_datetime).getFullYear() === year
  );
};

export const addScan = (scan: Scan) => {
  scans.push(scan);
};

export const findScanByUUID = (measure_uuid: string): Scan | undefined => {
  return scans.find((scan) => scan.measure_uuid === measure_uuid);
};

export const updateConfirmedValue = (scan: Scan, confirmed_value: number) => {
  scan.confirmed_value = confirmed_value;
};

export const filterScansByCustomerAndType = (
  customer_code: string,
  measure_type?: string
): Scan[] => {
  const validMeasureTypes = ["WATER", "GAS"];

  if (measure_type && !validMeasureTypes.includes(measure_type.toUpperCase())) {
    throw new Error("INVALID_TYPE");
  }

  return scans.filter((scan) => {
    const matchesCustomer = scan.customer_code === customer_code;
    const matchesType = measure_type
      ? scan.measure_type.toUpperCase() === measure_type.toUpperCase()
      : true;
    return matchesCustomer && matchesType;
  });
};
