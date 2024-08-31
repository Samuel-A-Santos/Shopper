import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { confirmScan, listScans, uploadScan, getFile } from "./scan.controller";
import { ScanSchema, ConfirmSchema, ListSchema } from "./scan.schema";
import { validateRequest } from "../../middleware/schemaValidator";

async function scanRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", async (req, res) => {
    await validateRequest(ScanSchema, req.body, res);
    return uploadScan(req.body, res);
  });

  fastify.patch('/confirm', async (req, res) => {
    await validateRequest(ConfirmSchema, req.body, res);
    return confirmScan(req.body, res);
  });

  fastify.get('/:customer_code/list', async (req, res) => {
    await validateRequest(ListSchema, req.body, res);
    return listScans(req, res);
  });

  fastify.get('/file/:filename', async (req: FastifyRequest, res: FastifyReply) => {
    return getFile((req.params as { filename: string }).filename);
  });
}

export default scanRoutes;
