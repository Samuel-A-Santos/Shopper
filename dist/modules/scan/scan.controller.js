"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScans = exports.confirmScan = exports.uploadScan = void 0;
const scan_service_1 = require("./scan.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generative_ai_1 = require("@google/generative-ai");
const uuid_1 = require("uuid");
const scan_schema_1 = require("./scan.schema");
const joi_1 = __importDefault(require("joi"));
const confirmSchema = joi_1.default.object({
    measure_uuid: joi_1.default.string().required(),
    confirmed_value: joi_1.default.number().integer().required()
});
const uploadScan = async function (request, reply) {
    try {
        // @ts-ignore
        const _this = this;
        const users = _this.mongo.db.collection("users");
        const body = request.body;
        const value = scan_schema_1.ScanSchema.validate(body);
        const measured_number = await queryGemini(request);
        const user = await users.findOne({ customer_code: body.customer_code });
        const newScan = {
            image: body.image,
            measure_datetime: body.measure_datetime,
            measure_type: body.measure_type,
            measured_number,
            measure_uuid: (0, uuid_1.v4)(),
            customer_code: body.customer_code,
        };
        if (user) {
            await users.updateOne({ customer_code: body.customer_code }, {
                $push: {
                    scans: newScan,
                },
            });
        }
        else {
            await users.insertOne({
                customer_code: body.customer_code,
                scans: [newScan],
            });
        }
        return reply.code(200).send(newScan);
    }
    catch (e) {
        if (e.details) {
            return reply
                .code(400)
                .send(e.details.map((detail) => detail.message));
        }
        return reply.code(500).send(e.message);
    }
};
exports.uploadScan = uploadScan;
const confirmScan = async (request, reply) => {
    try {
        console.log("Iniciando confirmação do scan");
        const { error, value } = confirmSchema.validate(request.body);
        if (error) {
            console.log("Erro de validação:", error.details);
            return reply.code(400).send({
                error_code: "INVALID_DATA",
                error_description: error.details.map(detail => detail.message).join(", ")
            });
        }
        const { measure_uuid, confirmed_value } = value;
        console.log(`Confirmando scan: ${measure_uuid} com valor: ${confirmed_value}`);
        const db = request.server.mongo.db;
        console.log("Buscando usuário com o scan");
        const users = db.collection("users");
        const user = await users.findOne({ "scans.measure_uuid": measure_uuid });
        if (!user) {
            console.log(`Scan não encontrado: ${measure_uuid}`);
            return reply.code(404).send({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada"
            });
        }
        console.log("Usuário encontrado, verificando o scan");
        const scan = user.scans.find((s) => s.measure_uuid === measure_uuid);
        if (!scan) {
            console.log(`Scan não encontrado no usuário: ${measure_uuid}`);
            return reply.code(404).send({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada"
            });
        }
        if (scan.confirmed_value !== undefined) {
            console.log(`Scan já confirmado: ${measure_uuid}`);
            return reply.code(409).send({
                error_code: "CONFIRMATION_DUPLICATE",
                error_description: "Leitura já confirmada"
            });
        }
        console.log("Atualizando o valor confirmado no banco de dados");
        const updateResult = await users.updateOne({ "scans.measure_uuid": measure_uuid }, { $set: { "scans.$.confirmed_value": confirmed_value } });
        console.log("Resultado da atualização:", updateResult);
        if (updateResult.modifiedCount === 0) {
            console.log("Nenhum documento foi atualizado");
            throw new Error("Falha ao atualizar o documento");
        }
        console.log("Scan confirmado com sucesso");
        return reply.code(200).send({ success: true });
    }
    catch (e) {
        console.error("Erro ao confirmar scan:", e);
        return reply.code(500).send({
            error_code: "INTERNAL_SERVER_ERROR",
            error_description: "Erro interno do servidor",
            details: e.message
        });
    }
};
exports.confirmScan = confirmScan;
const listScans = async (request, reply) => {
    const { customer_code } = request.params;
    const { measure_type } = request.query;
    const db = request.mongo?.db ||
        request.mongo?.client?.db() ||
        request.server?.mongo?.db;
    if (!db) {
        console.error("Falha na conexão com o banco de dados");
        console.log("request.mongo:", request.mongo);
        console.log("request.server:", request.server);
        return reply.code(500).send({
            error_code: "DATABASE_CONNECTION_FAILED",
            error_description: "Falha na conexão com o banco de dados"
        });
    }
    try {
        const users = db.collection("users");
        console.log(`Buscando usuário com customer_code: ${customer_code}`);
        const user = await users.findOne({ customer_code });
        if (!user) {
            console.log(`Usuário não encontrado para customer_code: ${customer_code}`);
            return reply.code(404).send({
                error_code: "CUSTOMER_NOT_FOUND",
                error_description: "Cliente não encontrado"
            });
        }
        console.log(`Usuário encontrado:`, user);
        let filteredScans = user.scans || [];
        console.log(`Número total de scans: ${filteredScans.length}`);
        if (measure_type) {
            filteredScans = filteredScans.filter((scan) => scan.measure_type === measure_type);
            console.log(`Numero de scans apos filtro por measure_type: ${filteredScans.length}`);
        }
        if (filteredScans.length === 0) {
            console.log(`Nenhum scan encontrado para o usuario`);
            return reply.code(404).send({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhuma leitura encontrada"
            });
        }
        console.log(`Retornando ${filteredScans.length} scans`);
        return reply.send({
            customer_code,
            measures: filteredScans,
        });
    }
    catch (e) {
        console.error("Erro ao listar scans:", e);
        return reply.code(500).send({
            error_code: "INTERNAL_SERVER_ERROR",
            error_description: "Erro interno do servidor"
        });
    }
};
exports.listScans = listScans;
async function queryGemini(request) {
    const value = await (0, scan_service_1.validateUploadData)(request.body);
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Retornar a medida do registro. Apenas o número, sem os zero a esquerda";
    const image = {
        inlineData: {
            data: request.body.image,
            mimeType: "image/png",
        },
    };
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const measure = response.text();
    return Number(measure.split(" ")[0]);
}
//# sourceMappingURL=scan.controller.js.map