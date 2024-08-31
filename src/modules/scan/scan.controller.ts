import { FastifyReply, FastifyRequest } from "fastify";
import {
  validateUploadData,
} from "./scan.service";
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Scan } from "./scan.types";
import { v4 as uuidv4 } from "uuid";
import { ScanSchema } from "./scan.schema";
import Joi from "joi";

interface User {
  customer_code: string;
  scans: Scan[];
}

const confirmSchema = Joi.object({
  measure_uuid: Joi.string().required(),
  confirmed_value: Joi.number().integer().required()
});

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

export const confirmScan = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
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

    const db = (request as any).server.mongo.db;

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
    const scan = user.scans.find((s: any) => s.measure_uuid === measure_uuid);

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
    const updateResult = await users.updateOne(
      { "scans.measure_uuid": measure_uuid },
      { $set: { "scans.$.confirmed_value": confirmed_value } }
    );

    console.log("Resultado da atualização:", updateResult);

    if (updateResult.modifiedCount === 0) {
      console.log("Nenhum documento foi atualizado");
      throw new Error("Falha ao atualizar o documento");
    }

    console.log("Scan confirmado com sucesso");
    return reply.code(200).send({ success: true });
  } catch (e: any) {
    console.error("Erro ao confirmar scan:", e);
    return reply.code(500).send({
      error_code: "INTERNAL_SERVER_ERROR",
      error_description: "Erro interno do servidor",
      details: e.message
    });
  }
};

export const listScans = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { customer_code } = request.params as { customer_code: string };
  const { measure_type } = request.query as { measure_type?: string };

  const db = (request as any).mongo?.db ||
    (request as any).mongo?.client?.db() ||
    (request as any).server?.mongo?.db;

  if (!db) {
    console.error("Falha na conexão com o banco de dados");
    console.log("request.mongo:", (request as any).mongo);
    console.log("request.server:", (request as any).server);
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
      filteredScans = filteredScans.filter(
        (scan: any) => scan.measure_type === measure_type
      );
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
  } catch (e: any) {
    console.error("Erro ao listar scans:", e);
    return reply.code(500).send({
      error_code: "INTERNAL_SERVER_ERROR",
      error_description: "Erro interno do servidor"
    });
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
