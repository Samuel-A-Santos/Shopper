import { FastifyInstance } from 'fastify';
import { uploadScan, confirmScan, listScans, testGemini } from './scan.controller';

async function scanRoutes(fastify: FastifyInstance) {
    // fastify.get('/test', async function (req, res) {
    //     const f = this as any
    //     const users = f.mongo.db.collection('users')

    //     const 

    //     // if the id is an ObjectId format, you need to create a new ObjectId
    //     const _id = new f.mongo.ObjectId('66d227fd80fee8e4c65e739c')
    //     try {
    //         const user = await users.findOne({ _id })
    //         return user
    //     } catch (err) {
    //         return err
    //     }
    // })
    fastify.post('/upload', uploadScan);
    fastify.patch('/confirm', confirmScan);
    // fastify.get('/:customer_code/list', listScans);
    // fastify.post('/scan/testGemini', testGemini);
}

export default scanRoutes;