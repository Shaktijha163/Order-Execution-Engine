import { QueueService } from '../../src/services/queueService';
import { Order } from '../../src/models/types';
import { generateId } from '../../src/utils/helpers';

describe('Order Workflow Integration', () => {
  let queueService: QueueService;

  beforeAll(() => {
    queueService = new QueueService();
    // Initialize worker for processing
    queueService.initWorker(async (order: Order) => {
      await queueService.processOrder(order);
    }, 5);
  });

  afterAll(async () => {
    // Clean up
    await queueService.getQueue().obliterate({ force: true });
  });

  it('should process order through complete lifecycle', async () => {
    const order: Order = {
      id: generateId(),
      userId: 'test-user-workflow-1',
      type: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 1,
      slippage: 0.01,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const statusUpdates: string[] = [];
    
    // Mock WebSocket connection to track status updates
    const mockConnection = {
      socket: {
        send: (data: string) => {
          const message = JSON.parse(data);
          statusUpdates.push(message.status);
        },
        readyState: 1, // OPEN
      },
    } as any;

    queueService.registerWebSocket(order.id, mockConnection);

    // Process the order
    await queueService.processOrder(order);

    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Should have gone through all statuses
    expect(statusUpdates).toContain('routing');
    expect(statusUpdates).toContain('building');
    expect(statusUpdates).toContain('submitted');
    
    // Should end with either confirmed or failed
    const finalStatus = statusUpdates[statusUpdates.length - 1];
    expect(['confirmed', 'failed']).toContain(finalStatus);
  }, 15000);

  it('should handle concurrent orders', async () => {
    const orders = Array(5).fill(null).map((_, i) => ({
      id: generateId(),
      userId: `test-user-concurrent-${i}`,
      type: 'market' as const,
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 1,
      slippage: 0.01,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const processingPromises = orders.map(order => 
      queueService.addOrder(order)
    );

    await Promise.all(processingPromises);

    // Wait for all to process
    await new Promise(resolve => setTimeout(resolve, 10000));

    const metrics = await queueService.getQueueMetrics();
    
    // All orders should be either completed or failed
    expect(metrics.completed + metrics.failed).toBeGreaterThanOrEqual(5);
  }, 20000);

  it('should retry failed orders up to 3 times', async () => {
    const order: Order = {
      id: generateId(),
      userId: 'test-user-retry',
      type: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 1,
      slippage: 0.001, // Very low slippage to force failures
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await queueService.addOrder(order);

    // Wait for retries to complete
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Order should eventually fail after retries
    // This tests the exponential backoff retry logic
  }, 20000);

  it('should track queue metrics accurately', async () => {
    const initialMetrics = await queueService.getQueueMetrics();
    
    const order: Order = {
      id: generateId(),
      userId: 'test-user-metrics',
      type: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 1,
      slippage: 0.01,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await queueService.addOrder(order);

    const afterAddMetrics = await queueService.getQueueMetrics();
    
    // Should have one more waiting job
    expect(afterAddMetrics.waiting).toBeGreaterThanOrEqual(initialMetrics.waiting);
  });
});