"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFile = exports.listScans = exports.confirmScan = exports.uploadScan = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generative_ai_1 = require("@google/generative-ai");
const uuid_1 = require("uuid");
const scan_model_1 = require("./scan.model");
const user_model_1 = __importDefault(require("../user/user.model"));
const scan_mapping_1 = require("./scan.mapping");
const mongodb_1 = require("mongodb");
const client = new mongodb_1.MongoClient(process.env.MONGODB_URI || 'mongodb://localhost/projeto2');
let bucket;
client.connect().then(() => {
    const db = client.db();
    bucket = new mongodb_1.GridFSBucket(db, { bucketName: 'uploads' });
});
const uploadScan = async function (body, reply) {
    const uuid = (0, uuid_1.v4)();
    const measured_number = await queryGemini(body);
    const user = await user_model_1.default.findOne({ customer_code: body.customer_code });
    const newScan = new scan_model_1.Scan({
        image: `${reply.request.hostname}/file/${uuid}`,
        measure_datetime: body.measure_datetime,
        measure_type: body.measure_type,
        measured_number,
        measure_uuid: uuid,
        customer_code: body.customer_code,
    });
    await newScan.save();
    await uploadArchive(body.image, newScan, uuid);
    if (user) {
        user.scans.push(newScan);
        await user.save();
    }
    else {
        const newUser = new user_model_1.default({
            customer_code: body.customer_code,
            scans: [newScan],
        });
        await newUser.save();
    }
    return reply.code(200).send((0, scan_mapping_1.uploadScanResponseMapping)(newScan));
};
exports.uploadScan = uploadScan;
const confirmScan = async ({ measure_uuid, confirmed_value }, reply) => {
    const scan = await scan_model_1.Scan.findOne({ measure_uuid });
    if (!scan) {
        return reply.code(404).send({
            error_code: "MEASURE_NOT_FOUND",
            error_description: "Leitura não encontrada"
        });
    }
    const user = await user_model_1.default.findOne({ customer_code: scan.customer_code });
    if (!user) {
        return reply.code(404).send({
            error_code: "CUSTOMER_NOT_FOUND",
            error_description: "Cliente não encontrado"
        });
    }
    if (scan.confirmed_value !== undefined) {
        return reply.code(409).send({
            error_code: "CONFIRMATION_DUPLICATE",
            error_description: "Leitura já confirmada"
        });
    }
    scan.confirmed_value = confirmed_value;
    await scan.save();
    return reply.code(200).send({ success: true });
};
exports.confirmScan = confirmScan;
const listScans = async (request, reply) => {
    const { customer_code } = request.params;
    const { measure_type } = request.query;
    const user = await user_model_1.default.findOne({ customer_code }).select('-_id -__v').exec();
    if (!user) {
        return reply.code(404).send({
            error_code: "CUSTOMER_NOT_FOUND",
            error_description: "Cliente não encontrado"
        });
    }
    const scans = user.scans || [];
    const scansJson = await Promise.all(scans.map((scan) => scan_model_1.Scan.findOne({ _id: scan._id })));
    let listScans = await scan_model_1.Scan.find({ measure_uuid: { $in: scansJson.map((scan) => scan.measure_uuid) } }).select('-_id -__v');
    if (measure_type) {
        listScans = listScans.filter((scan) => String(scan.measure_type).toUpperCase() === measure_type.toUpperCase());
    }
    if (listScans.length === 0) {
        return reply.code(404).send({
            error_code: "MEASURES_NOT_FOUND",
            error_description: "Nenhuma leitura encontrada"
        });
    }
    console.log(`Retornando ${listScans.length} scans`);
    return reply.send({
        customer_code,
        measures: listScans,
    });
};
exports.listScans = listScans;
const uploadArchive = async function (data, scan, uuid) {
    const archiveData = Buffer.from(data, 'base64');
    const uploadStream = bucket.openUploadStream(uuid);
    uploadStream.end(archiveData);
    const scanFound = await scan_model_1.Scan.findOne({ measure_uuid: scan.measure_uuid });
    if (scanFound) {
        scanFound.archive_uuid = uuid;
        await scanFound.save();
    }
    return { uuid };
};
const getFile = async (filename) => {
    const downloadStream = bucket.openDownloadStreamByName(filename);
    const fileData = await downloadStream.toArray();
    let imgData = new Blob(fileData, { type: 'image/png' });
    return imgData.stream();
};
exports.getFile = getFile;
async function queryGemini(body) {
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Retornar a medida do registro. Apenas o número, sem os zero a esquerda";
    const image = {
        inlineData: {
            data: body.image,
            mimeType: "image/png",
        },
    };
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const measure = response.text();
    return Number(measure.split(" ")[0]);
}
//# sourceMappingURL=scan.controller.js.map