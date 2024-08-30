"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_controller_1 = require("./scan.controller");
async function scanRoutes(fastify) {
    fastify.post("/upload", scan_controller_1.uploadScan);
    // fastify.patch('/confirm', confirmScan);
    // fastify.get('/:customer_code/list', listScans);
    // fastify.post('/scan/testGemini', testGemini);
}
exports.default = scanRoutes;
//# sourceMappingURL=scan.routes.js.map