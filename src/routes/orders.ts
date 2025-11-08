import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/orderService';
import { QueueService } from '../services/queueService';
import { OrderRequestSchema, OrderRequestJsonSchema } from '../models/order';
import { WebSocketMessage } from '../models/types';

interface OrderExecuteBody {
  userId: string;
  type: 'market';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage?: number;
}

interface OrderWebSocketParams {
  Params: {
    orderId: string;
  };
}

export async function orderRoutes(
  fastify: FastifyInstance,
  options: { orderService: OrderService; queueService: QueueService }
) {
  const { orderService, queueService } = options;

  // POST /api/orders/execute - Create and queue order
  fastify.post(
    '/execute',
  //   {
  //     schema: {
  //       body: OrderRequestJsonSchema,
  //     },
  //   },
    async (
      request: FastifyRequest<{ Body: OrderExecuteBody }>,
      reply: FastifyReply
    ) => {
      try {
        const orderRequestUnknown = request.body as unknown;
        const validatedData = OrderRequestSchema.parse(orderRequestUnknown);

        // Create order (saves to DB only)
        const order = await orderService.createOrder(validatedData);

        // Send initial pending status and add to queue
        await queueService.sendStatusUpdate(order.id, 'pending');
        await queueService.addOrder(order);

        reply.code(201).send({
          success: true,
          orderId: order.id,
          message: 'Order submitted successfully',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fastify.log.error({ err }, 'Error creating order');
        reply.code(400).send({
          success: false,
          error: msg,
        });
      }
    }
  );

  // WebSocket endpoint: ws://host/api/orders/ws/:orderId
  fastify.get(
    '/ws/:orderId',
    { websocket: true },
    (connection, req: FastifyRequest<OrderWebSocketParams>) => {
      const { orderId } = req.params;
      fastify.log.info(`WebSocket connection established for order ${orderId}`);
      
      queueService.registerWebSocket(orderId, connection);

      const initialMessage: WebSocketMessage = {
        type: 'status_update',
        orderId,
        status: 'pending',
      };
      connection.socket.send(JSON.stringify(initialMessage));

      connection.socket.on('close', () => {
        fastify.log.info(`WebSocket closed for order ${orderId}`);
        queueService.unregisterWebSocket(orderId);
      });
      
      connection.socket.on('error', (err) => {
        fastify.log.error({ err, orderId }, 'WebSocket error');
        queueService.unregisterWebSocket(orderId);
      });
    }
  );

  // GET /api/orders/:orderId - Fetch order details
  fastify.get(
    '/:orderId',
    async (req: FastifyRequest<OrderWebSocketParams>, reply: FastifyReply) => {
      try {
        const { orderId } = req.params;
        const order = await orderService.getOrder(orderId);
        
        if (!order) {
          reply.code(404).send({
            success: false,
            error: 'Order not found',
          });
          return;
        }

        reply.send({
          success: true,
          order,
        });
      } catch (err) {
        fastify.log.error({ err }, 'Error fetching order');
        reply.code(500).send({
          success: false,
          error: 'Failed to fetch order',
        });
      }
    }
  );

  // GET /api/orders/metrics - Queue metrics
  fastify.get(
    '/metrics',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const metrics = await queueService.getQueueMetrics();
        reply.send({ success: true, metrics });
      } catch (err) {
        fastify.log.error({ err }, 'Error fetching metrics');
        reply.code(500).send({ success: false, error: 'Failed to fetch metrics' });
      }
    }
  );
}