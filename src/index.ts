import fastify from 'fastify';
import scanRoutes from './modules/scan/scan.routes';

const server = fastify();


server.register(scanRoutes);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});