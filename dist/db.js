"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = void 0;
const mongodb_1 = require("mongodb");
// Replace the placeholder with your Atlas connection string
const uri = "mongodb://localhost/projeto2";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const getDb = async () => {
    try {
        const conn = await client.connect();
        return await conn.db('projeto2');
    }
    catch (e) {
        console.log(e);
    }
};
exports.getDb = getDb;
