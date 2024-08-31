import { FastifyReply, FastifyRequest } from "fastify";
import {
  validateUploadData,
  validateConfirmData,
  findExistingScan,
  addScan,
  findScanByUUID,
  updateConfirmedValue,
  filterScansByCustomerAndType,
} from "./scan.service";
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Scan } from "./scan.types";
import { v4 as uuidv4 } from "uuid";
import { ScanSchema } from "./scan.schema";

interface User {
  customer_code: string;
  scans: Scan[];
}

export const uploadScan = async function (
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore
    const _this = this as any;
    const users = _this.mongo.db.collection("users");
    const body: any = request.body;

    const value = ScanSchema.validate(body);

    const measured_number = await queryGemini(request);

    const user = await users.findOne({ customer_code: body.customer_code });

    const newScan = {
      image: body.image,
      measure_datetime: body.measure_datetime,
      measure_type: body.measure_type,
      measured_number,
      measure_uuid: uuidv4(),
      customer_code: body.customer_code,
    };

    if (user) {
      await users.updateOne(
        { customer_code: body.customer_code },
        {
          $push: {
            scans: newScan,
          },
        }
      );
    } else {
      await users.insertOne({
        customer_code: body.customer_code,
        scans: [newScan],
      });
    }

    return reply.code(200).send(newScan);
  } catch (e: any) {
    if (e.details) {
      return reply
        .code(400)
        .send(e.details.map((detail: any) => detail.message));
    }
    return reply.code(500).send(e.message);
  }
};

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

export const listScans = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { customer_code } = request.params as { customer_code: string };
  const { measure_type } = request.query as { measure_type?: string };

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
      filteredScans = filteredScans.filter(
        (scan: Scan) => scan.measure_type === measure_type
      );
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
  } catch (e: any) {
    return reply.code(500).send(e.message);
  }
};
async function queryGemini(request) {
  const value = await validateUploadData(request.body);

  const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt =
    "Retornar a medida do registro. Apenas o número, sem os zero a esquerda";
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
