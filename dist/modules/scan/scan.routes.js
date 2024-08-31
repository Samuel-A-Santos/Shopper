"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_controller_1 = require("./scan.controller");
const scan_schema_1 = require("./scan.schema");
const schemaValidator_1 = require("../../middleware/schemaValidator");
async function scanRoutes(fastify) {
    fastify.post("/upload", async (req, res) => {
        await (0, schemaValidator_1.validateRequest)(scan_schema_1.ScanSchema, req.body, res);
        return (0, scan_controller_1.uploadScan)(req.body, res);
    });
    fastify.patch('/confirm', async (req, res) => {
        await (0, schemaValidator_1.validateRequest)(scan_schema_1.ConfirmSchema, req.body, res);
        return (0, scan_controller_1.confirmScan)(req.body, res);
    });
    fastify.get('/:customer_code/list', async (req, res) => {
        await (0, schemaValidator_1.validateRequest)(scan_schema_1.ListSchema, req.body, res);
        return (0, scan_controller_1.listScans)(req, res);
    });
    fastify.get('/file/:filename', async (req, res) => {
        return (0, scan_controller_1.getFile)(req.params.filename);
    });
}
exports.default = scanRoutes;
//# sourceMappingURL=scan.routes.js.map