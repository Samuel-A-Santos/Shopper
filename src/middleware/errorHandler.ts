import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error.validation) {
      reply.status(400).send({
        error_code: "INVALID_DATA",
        error_description: error.message,
      });
    } else {
      reply.status(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "Erro interno do servidor",
        details: error.message,
      });
    }
  });
}