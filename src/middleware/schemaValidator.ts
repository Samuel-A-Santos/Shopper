import { FastifyReply } from "fastify";

export async function validateRequest(schema: any, value: any, reply: FastifyReply) {
  try {
    await schema.validateAsync(value);
  } catch (error) {
    reply.code(400).send({
      error_code: "INVALID_DATA",
      error_description: (error as any).details.map((detail: any) => detail.message).join(", "),
    });
    throw error;
  }
}
