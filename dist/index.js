"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const scan_routes_1 = __importDefault(require("./modules/scan/scan.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("./middleware/errorHandler");
const fastify_multipart_1 = __importDefault(require("fastify-multipart"));
dotenv_1.default.config();
const server = (0, fastify_1.default)({ logger: false });
server.register(fastify_multipart_1.default);
const start = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost/projeto2', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        server.register(scan_routes_1.default);
        (0, errorHandler_1.errorHandler)(server); // Register the error handler
        await server.listen({ port: 8081, host: '0.0.0.0' });
        const address = server.server.address();
        if (address && typeof address !== 'string') {
            console.log(`Servidor rodando em ${address.address}:${address.port}`);
        }
        else {
            console.log('Servidor rodando, mas não foi possível obter o endereço.');
        }
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map