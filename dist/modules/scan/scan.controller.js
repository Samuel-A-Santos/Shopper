"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScans = exports.uploadScan = void 0;
const scan_service_1 = require("./scan.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generative_ai_1 = require("@google/generative-ai");
const uuid_1 = require("uuid");
const scan_schema_1 = require("./scan.schema");
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
// export const confirmScan = async (
//   request: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   try {
//     const value = await validateConfirmData(request.body);
//     const existingScan = findScanByUUID(value.measure_uuid);
//     if (!existingScan) {
//       return reply.code(404).send({
//         error_code: "MEASURE_NOT_FOUND",
//         error_description: "Leitura não encontrada",
//       });
//     }
//     if (existingScan.confirmed_value !== undefined) {
//       return reply.code(409).send({
//         error_code: "CONFIRMATION_DUPLICATE",
//         error_description: "Leitura já confirmada",
//       });
//     }
//     updateConfirmedValue(existingScan, value.confirmed_value);
//     return reply.code(200).send({ success: true });
//   } catch (e: any) {
//     if (e.details) {
//       return reply.code(400).send({
//         error_code: "INVALID_DATA",
//         error_description: e.details
//           .map((detail: any) => detail.message)
//           .join(", "),
//       });
//     }
//     return reply.code(500).send(e.message);
//   }
// };
const listScans = async (request, reply) => {
    const { customer_code } = request.params;
    const { measure_type } = request.query;
    const db = request.mongo?.db;
    if (!db) {
        return reply.code(500).send("Database connection failed.");
    }
    try {
        const user = await db.collection("users").findOne({ customer_code });
        if (!user) {
            return reply.code(404).send({
                error_code: "CUSTOMER_NOT_FOUND",
                error_description: "Cliente não encontrado",
            });
        }
        let filteredScans = user.scans;
        if (measure_type) {
            filteredScans = filteredScans.filter((scan) => scan.measure_type === measure_type);
        }
        if (filteredScans.length === 0) {
            return reply.code(404).send({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhuma leitura encontrada",
            });
        }
        return reply.code(200).send({
            customer_code,
            measures: filteredScans,
        });
    }
    catch (e) {
        return reply.code(500).send(e.message);
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