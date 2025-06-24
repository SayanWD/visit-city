'use strict';

const fastify = require('fastify')({ logger: true });

// Health-check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
