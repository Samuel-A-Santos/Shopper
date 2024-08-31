"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const scan_routes_1 = __importDefault(require("./modules/scan/scan.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = __importDefault(require("@fastify/mongodb"));
dotenv_1.default.config();
const server = (0, fastify_1.default)({ logger: true });
const start = async () => {
    try {
        await server.register(mongodb_1.default, {
            forceClose: true,
            url: process.env.MONGODB_URI || 'mongodb://localhost/projeto2'
        });
        server.register(scan_routes_1.default);
        await server.listen({ port: 8080, host: '0.0.0.0' });
        console.log(`Servidor rodando em ${server.server.address()}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map