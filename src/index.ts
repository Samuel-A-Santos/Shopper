import fastify from "fastify";
import scanRoutes from "./modules/scan/scan.routes";
import dotenv from "dotenv";
import fastifyMongodb from "@fastify/mongodb";

dotenv.config();

const server = fastify({ logger: true });

const start = async () => {
  try {
    await server.register(fastifyMongodb, {
      forceClose: true,
      url: process.env.MONGODB_URI || 'mongodb://localhost/projeto2'
    });

    server.register(scanRoutes);

    await server.listen({ port: 8080, host: '0.0.0.0' });
    console.log(`Servidor rodando em ${server.server.address()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();