import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';  
import { orderRoutes } from './routes/orders';
import { OrderService } from './services/orderService';
import { QueueService } from './services/queueService';
import { initDB } from './db/postgres';
import { initRedis } from './db/redis';
import { OrderProcessor } from './queue/orderProcessor';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: { target: 'pino-pretty' },
  },
});
fastify.register(fastifyCors, {
  origin: true, //(for development)
  credentials: true,
});
// Register WebSocket plugin
fastify.register(fastifyWebsocket);

// Initialize services
const queueService = new QueueService();
const orderService = new OrderService();

// Start worker with concurrency=10
const processor = new OrderProcessor(queueService.getQueue(), queueService);
processor.start(10);

// Register order routes with prefix
fastify.register(orderRoutes, { 
  prefix: '/api/orders',
  orderService, 
  queueService 
});

// Health check endpoint
fastify.get('/health', async (_req, reply) => {
  reply.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint with API documentation
fastify.get('/', async (_req, reply) => {
  reply.send({
    name: 'Order Execution Engine',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      metrics: 'GET /api/orders/metrics',
      executeOrder: {
        method: 'POST',
        path: '/api/orders/execute',
        body: {
          userId: 'string',
          type: 'market',
          tokenIn: 'string (e.g., SOL, USDC)',
          tokenOut: 'string (e.g., BONK)',
          amountIn: 'number',
          slippage: 'number (0..1, optional, default: 0.01)',
        },
        response: {
          success: 'boolean',
          orderId: 'string',
          message: 'string',
        },
      },
      getOrder: {
        method: 'GET',
        path: '/api/orders/:orderId',
        response: {
          success: 'boolean',
          order: 'Order object',
        },
      },
      websocket: {
        protocol: 'WebSocket',
        path: 'ws://<host>/api/orders/ws/:orderId',
        description: 'Connect after order creation to receive live status updates',
        statusFlow: [
          'pending',
          'routing',
          'building',
          'submitted',
          'confirmed (or failed)',
        ],
      },
    },
  });
});

const start = async () => {
  try {
    await initDB();
    await initRedis();

    const PORT = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    console.log(`\n Order Execution Engine running on port ${PORT}`);
    console.log(`Metrics: http://localhost:${PORT}/api/orders/metrics`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(` WebSocket: ws://localhost:${PORT}/api/orders/ws/:orderId\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();