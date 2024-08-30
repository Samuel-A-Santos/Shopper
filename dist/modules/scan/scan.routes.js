"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_controller_1 = require("./scan.controller");
async function scanRoutes(fastify) {
    fastify.post('/upload', scan_controller_1.uploadScan);
    fastify.patch('/confirm', scan_controller_1.confirmScan);
    fastify.get('/:customer_code/list', scan_controller_1.listScans);
}
exports.default = scanRoutes;
