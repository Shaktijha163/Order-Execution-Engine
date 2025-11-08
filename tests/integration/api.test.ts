import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { orderRoutes } from '../../src/routes/orders';
import { OrderService } from '../../src/services/orderService';
import { QueueService } from '../../src/services/queueService';
import WebSocket from 'ws';

describe('Order API Integration Tests', () => {
  let app: any;
  let queueService: QueueService;
  let orderService: OrderService;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(fastifyWebsocket);

    queueService = new QueueService();
    orderService = new OrderService();

    await app.register(orderRoutes, {
      prefix: '/api/orders',
      orderService,
      queueService,
    });

    await app.ready();
    await app.listen({ port: 0 }); 
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/orders/execute', () => {
    it('should create a new order successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: {
          userId: 'test-user-1',
          type: 'market',
          tokenIn: 'SOL',
          tokenOut: 'USDC',
          amountIn: 1.5,
          slippage: 0.01,
        },
      });
      console.log('=== TEST 1 DEBUG ===');
      console.log('Status:', response.statusCode);
      console.log('Body:', response.body);
      console.log('===================');

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.orderId).toBeDefined();
      expect(body.message).toBe('Order submitted successfully');
    });

    it('should reject invalid order (negative amount)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: {
          userId: 'test-user-2',
          type: 'market',
          tokenIn: 'SOL',
          tokenOut: 'USDC',
          amountIn: -1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should reject invalid order (missing tokenIn)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: {
          userId: 'test-user-3',
          type: 'market',
          tokenOut: 'USDC',
          amountIn: 1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should apply default slippage if not provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: {
          userId: 'test-user-4',
          type: 'market',
          tokenIn: 'SOL',
          tokenOut: 'USDC',
          amountIn: 1,
        },
      });
    console.log('=== TEST 4 DEBUG ===');
    console.log('Status:', response.statusCode);
    console.log('Body:', response.body);
    console.log('===================');

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should return 404 for non-existent order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Order not found');
    });
  });

  describe('GET /api/orders/metrics', () => {
    it('should return queue metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/metrics',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.metrics).toBeDefined();
      expect(body.metrics).toHaveProperty('waiting');
      expect(body.metrics).toHaveProperty('active');
      expect(body.metrics).toHaveProperty('completed');
      expect(body.metrics).toHaveProperty('failed');
    });
  });

  describe('WebSocket /api/orders/ws/:orderId', () => {
    it('should establish WebSocket connection and receive initial status', (done) => {
      const testOrderId = 'ws-test-order-1';
      const wsUrl = `ws://localhost:${app.server.address().port}/api/orders/ws/${testOrderId}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('status_update');
        expect(message.orderId).toBe(testOrderId);
        expect(message.status).toBe('pending');
        ws.close();
        done();
      });

      ws.on('error', (err) => {
        done(err);
      });
    }, 10000);

    it('should handle multiple WebSocket connections', (done) => {
      const orderId1 = 'ws-test-order-2';
      const orderId2 = 'ws-test-order-3';
      
      const ws1 = new WebSocket(`ws://localhost:${app.server.address().port}/api/orders/ws/${orderId1}`);
      const ws2 = new WebSocket(`ws://localhost:${app.server.address().port}/api/orders/ws/${orderId2}`);
      
      let received1 = false;
      let received2 = false;

      ws1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        expect(message.orderId).toBe(orderId1);
        received1 = true;
        ws1.close();
        if (received1 && received2) done();
      });

      ws2.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        expect(message.orderId).toBe(orderId2);
        received2 = true;
        ws2.close();
        if (received1 && received2) done();
      });
    }, 10000);
  });
});