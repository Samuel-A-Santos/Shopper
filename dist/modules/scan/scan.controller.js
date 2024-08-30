"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScans = exports.confirmScan = exports.uploadScan = void 0;
const scan_service_1 = require("./scan.service");
const uploadScan = async (request, reply) => {
    try {
        const value = await (0, scan_service_1.validateUploadData)(request.body);
        const existingScan = (0, scan_service_1.findExistingScan)(value.customer_code, value.measure_datetime);
        if (existingScan) {
            return reply.code(409).send({
                error_code: "DOUBLE_REPORT",
                error_description: "Leitura do mês já realizada"
            });
        }
        const geminiData = {
            measured_number: 12345,
            measure_uuid: "mocked-uuid-12345"
        };
        (0, scan_service_1.addScan)({ ...value, measured_number: geminiData.measured_number, measure_uuid: geminiData.measure_uuid });
        return reply.code(200).send({
            image_url: value.image,
            measure_value: geminiData.measured_number,
            measure_uuid: geminiData.measure_uuid
        });
    }
    catch (e) {
        if (e.details) {
            return reply.code(400).send(e.details.map((detail) => detail.message));
        }
        return reply.code(500).send(e.message);
    }
};
exports.uploadScan = uploadScan;
const confirmScan = async (request, reply) => {
    try {
        const value = await (0, scan_service_1.validateConfirmData)(request.body);
        const existingScan = (0, scan_service_1.findScanByUUID)(value.measure_uuid);
        if (!existingScan) {
            return reply.code(404).send({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada"
            });
        }
        if (existingScan.confirmed_value !== undefined) {
            return reply.code(409).send({
                error_code: "CONFIRMATION_DUPLICATE",
                error_description: "Leitura já confirmada"
            });
        }
        (0, scan_service_1.updateConfirmedValue)(existingScan, value.confirmed_value);
        return reply.code(200).send({ success: true });
    }
    catch (e) {
        if (e.details) {
            return reply.code(400).send({
                error_code: "INVALID_DATA",
                error_description: e.details.map((detail) => detail.message).join(", ")
            });
        }
        return reply.code(500).send(e.message);
    }
};
exports.confirmScan = confirmScan;
const listScans = async (request, reply) => {
    const { customer_code } = request.params;
    const { measure_type } = request.query;
    try {
        const filteredScans = (0, scan_service_1.filterScansByCustomerAndType)(customer_code, measure_type);
        if (filteredScans.length === 0) {
            return reply.code(404).send({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhuma leitura encontrada"
            });
        }
        const measures = filteredScans.map(scan => ({
            measure_uuid: scan.measure_uuid,
            measure_datetime: scan.measure_datetime,
            measure_type: scan.measure_type,
            has_confirmed: scan.confirmed_value !== undefined,
            image_url: scan.image
        }));
        return reply.code(200).send({
            customer_code: customer_code,
            measures: measures
        });
    }
    catch (e) {
        if (e.message === "INVALID_TYPE") {
            return reply.code(400).send({
                error_code: "INVALID_TYPE",
                error_description: "Tipo de medição não permitida"
            });
        }
        return reply.code(500).send(e.message);
    }
};
exports.listScans = listScans;
