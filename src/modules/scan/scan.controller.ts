import { FastifyReply, FastifyRequest } from 'fastify';
import {
    validateUploadData,
    validateConfirmData,
    findExistingScan,
    addScan,
    findScanByUUID,
    updateConfirmedValue,
    filterScansByCustomerAndType
} from './scan.service';

export const uploadScan = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const value = await validateUploadData(request.body);

        const existingScan = findExistingScan(value.customer_code, value.measure_datetime);

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

        addScan({ ...value, measured_number: geminiData.measured_number, measure_uuid: geminiData.measure_uuid });

        return reply.code(200).send({
            image_url: value.image,
            measure_value: geminiData.measured_number,
            measure_uuid: geminiData.measure_uuid
        });
    } catch (e: any) {
        if (e.details) {
            return reply.code(400).send(e.details.map((detail: any) => detail.message));
        }
        return reply.code(500).send(e.message);
    }
};

export const confirmScan = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const value = await validateConfirmData(request.body);

        const existingScan = findScanByUUID(value.measure_uuid);

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

        updateConfirmedValue(existingScan, value.confirmed_value);

        return reply.code(200).send({ success: true });
    } catch (e: any) {
        if (e.details) {
            return reply.code(400).send({
                error_code: "INVALID_DATA",
                error_description: e.details.map((detail: any) => detail.message).join(", ")
            });
        }
        return reply.code(500).send(e.message);
    }
};

export const listScans = async (request: FastifyRequest, reply: FastifyReply) => {
    const { customer_code } = request.params as { customer_code: string };
    const { measure_type } = request.query as { measure_type?: string };

    try {
        const filteredScans = filterScansByCustomerAndType(customer_code, measure_type);

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
    } catch (e: any) {
        if (e.message === "INVALID_TYPE") {
            return reply.code(400).send({
                error_code: "INVALID_TYPE",
                error_description: "Tipo de medição não permitida"
            });
        }
        return reply.code(500).send(e.message);
    }
};