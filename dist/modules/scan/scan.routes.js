"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_controller_1 = require("./scan.controller");
async function scanRoutes(fastify) {
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
    fastify.post('/upload', scan_controller_1.uploadScan);
    fastify.patch('/confirm', scan_controller_1.confirmScan);
    // fastify.get('/:customer_code/list', listScans);
    // fastify.post('/scan/testGemini', testGemini);
}
exports.default = scanRoutes;
