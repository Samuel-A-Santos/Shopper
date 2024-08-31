import fastify from "fastify";
import scanRoutes from "./modules/scan/scan.routes";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errorHandler";
import fastifyMultipart from "fastify-multipart";

dotenv.config();

const server = fastify({ logger: false });

server.register(fastifyMultipart);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/projeto2', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    server.register(scanRoutes);
    errorHandler(server); // Register the error handler

    await server.listen({ port: 8081, host: '0.0.0.0' });
    const address = server.server.address();
    if (address && typeof address !== 'string') {
      console.log(`Servidor rodando em ${address.address}:${address.port}`);
    } else {
      console.log('Servidor rodando, mas não foi possível obter o endereço.');
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();