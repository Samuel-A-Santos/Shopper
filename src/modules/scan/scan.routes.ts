import { FastifyInstance } from "fastify";
import { listScans, uploadScan } from "./scan.controller";

async function scanRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", uploadScan);
  // fastify.patch('/confirm', confirmScan);
  fastify.get('/:customer_code/list', listScans);
  // fastify.post('/scan/testGemini', testGemini);
}

export default scanRoutes;
