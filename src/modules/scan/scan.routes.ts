import { FastifyInstance } from 'fastify';
import { uploadScan, confirmScan, listScans } from './scan.controller';

async function scanRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', uploadScan);
    fastify.patch('/confirm', confirmScan);
    fastify.get('/:customer_code/list', listScans);
}

export default scanRoutes;