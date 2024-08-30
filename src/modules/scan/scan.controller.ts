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
import { google } from "googleapis";
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

// export const testGemini = async (
//   request: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   try {
//     const { imageBase64 } = request.body as { imageBase64: string };

//     if (!imageBase64) {
//       return reply.code(400).send({ error: "Image data is required" });
//     }

//     // Initialize the Google API
//     const genaiService = await google.discoverAPI(GENAI_DISCOVERY_URL);
//     const geminiKey = process.env.GEMINI_KEY;
//     if (!geminiKey) {
//       throw new Error("GEMINI_KEY is not set");
//     }
//     const auth = new google.auth.GoogleAuth().fromAPIKey(geminiKey);

//     // Convert the base64 image into a buffer stream
//     const bufferStream = new stream.PassThrough();
//     bufferStream.end(Buffer.from(imageBase64, "base64"));

//     const media = {
//       mimeType: "image/png", // Assuming the image is a PNG, change this if necessary
//       body: bufferStream,
//     };

//     const requestBody = {
//       file: { displayName: "Uploaded Image" },
//     };

//     // Upload the image to Gemini
//     const createFileResponse = await genaiService.media["media.upload"]({
//       media: media,
//       auth: auth,
//       requestBody: requestBody,
//     });

//     const file = createFileResponse.data.file;

//     // Prepare contents for generating the text from the image
//     const contents = {
//       contents: [
//         {
//           role: "user",
//           parts: [
//             { file_data: { file_uri: file.uri, mime_type: file.mimeType } },
//           ],
//         },
//       ],
//       generation_config: {
//         maxOutputTokens: 4096,
//         temperature: 0.5,
//         topP: 0.8,
//       },
//     };

//     // Generate content from the image using Gemini
//     const generateContentResponse = await genaiService.models[
//       "generateContent"
//     ]({
//       model: `models/gemini-1.5-pro-latest`,
//       requestBody: contents,
//       auth: auth,
//     });

//     const measuredValue =
//       generateContentResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

//     return reply.code(200).send({
//       measured_value: measuredValue,
//       success: true,
//     });
//   } catch (e: any) {
//     console.error("Error during Gemini API request:", e.message);
//     return reply.code(500).send({
//       error: "Failed to process image",
//       details: e.message,
//     });
//   }
// };

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

// // export const listScans = async (
// //   request: FastifyRequest,
// //   reply: FastifyReply
// // ) => {
// //   const { customer_code } = request.params as { customer_code: string };
// //   const { measure_type } = request.query as { measure_type?: string };

// //   try {
// //     const filteredScans = filterScansByCustomerAndType(
// //       customer_code,
// //       measure_type
// //     );

// //     if (filteredScans.length === 0) {
// //       return reply.code(404).send({
// //         error_code: "MEASURES_NOT_FOUND",
// //         error_description: "Nenhuma leitura encontrada",
// //       });
// //     }

// //     const measures = filteredScans.map((scan) => ({
// //       measure_uuid: scan.measure_uuid,
// //       measure_datetime: scan.measure_datetime,
// //       measure_type: scan.measure_type,
// //       has_confirmed: scan.confirmed_value !== undefined,
// //       image_url: scan.image,
// //     }));

// //     return reply.code(200).send({
// //       customer_code: customer_code,
// //       measures: measures,
// //     });
// //   } catch (e: any) {
// //     if (e.message === "INVALID_TYPE") {
// //       return reply.code(400).send({
// //         error_code: "INVALID_TYPE",
// //         error_description: "Tipo de medição não permitida",
// //       });
// //     }
// //     return reply.code(500).send(e.message);
// //   }
// // };
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
