"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
async function validateRequest(schema, value, reply) {
    try {
        await schema.validateAsync(value);
    }
    catch (error) {
        reply.code(400).send({
            error_code: "INVALID_DATA",
            error_description: error.details.map((detail) => detail.message).join(", "),
        });
        throw error;
    }
}
//# sourceMappingURL=schemaValidator.js.map