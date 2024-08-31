"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(fastify) {
    fastify.setErrorHandler((error, request, reply) => {
        if (error.validation) {
            reply.status(400).send({
                error_code: "INVALID_DATA",
                error_description: error.message,
            });
        }
        else {
            reply.status(500).send({
                error_code: "INTERNAL_SERVER_ERROR",
                error_description: "Erro interno do servidor",
                details: error.message,
            });
        }
    });
}
//# sourceMappingURL=errorHandler.js.map