import { FastifyReply, FastifyRequest } from "fastify";
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { Scan, IScan } from "./scan.model";
import User from "../user/user.model";
import { uploadScanResponseMapping } from "./scan.mapping";
import { MongoClient, GridFSBucket } from "mongodb";

interface User {
  customer_code: string;
  scans: IScan[];
}

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost/projeto2');
let bucket: GridFSBucket;

client.connect().then(() => {
  const db = client.db();
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
});

export const uploadScan = async function (
  body: any,
  reply: FastifyReply
) {
  const uuid = uuidv4();
  const measured_number = await queryGemini(body);
  const user = await User.findOne({ customer_code: body.customer_code });

  const newScan = new Scan({
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
  } else {
    const newUser = new User({
      customer_code: body.customer_code,
      scans: [newScan],
    });
    await newUser.save();
  }

  return reply.code(200).send(uploadScanResponseMapping(newScan));
};

export const confirmScan = async (
  { measure_uuid, confirmed_value }: any,
  reply: FastifyReply
) => {
  const scan = await Scan.findOne({ measure_uuid });

  if (!scan) {
    return reply.code(404).send({
      error_code: "MEASURE_NOT_FOUND",
      error_description: "Leitura não encontrada"
    });
  }

  const user = await User.findOne({ customer_code: scan.customer_code });

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

export const listScans = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { customer_code } = request.params as { customer_code: string };
  const { measure_type } = request.query as { measure_type?: string };

  const user = await User.findOne({ customer_code }).select('-_id -__v').exec();

  if (!user) {
    return reply.code(404).send({
      error_code: "CUSTOMER_NOT_FOUND",
      error_description: "Cliente não encontrado"
    });
  }

  const scans = user.scans || [];
  const scansJson = await Promise.all(scans.map((scan: any) => Scan.findOne({ _id: scan._id })));
  let listScans = await Scan.find({ measure_uuid: { $in: scansJson.map((scan: any) => scan.measure_uuid) } }).select('-_id -__v');

  if (measure_type) {
    listScans = listScans.filter(
      (scan: any) => String(scan.measure_type).toUpperCase() === measure_type.toUpperCase()
    );
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

const uploadArchive = async function (
  data: any,
  scan: IScan,
  uuid: string
) {
  const archiveData = Buffer.from(data, 'base64');

  const uploadStream = bucket.openUploadStream(uuid);
  uploadStream.end(archiveData);

  const scanFound = await Scan.findOne({ measure_uuid: scan.measure_uuid });

  if (scanFound) {
    scanFound.archive_uuid = uuid;
    await scanFound.save();
  }

  return { uuid };
};

export const getFile = async (filename: string) => {
  const downloadStream = bucket.openDownloadStreamByName(filename);
  const fileData = await downloadStream.toArray();
  let imgData = new Blob(fileData, { type: 'image/png' });
  return imgData.stream();
}

async function queryGemini(body) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt =
    "Retornar a medida do registro. Apenas o número, sem os zero a esquerda";
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


