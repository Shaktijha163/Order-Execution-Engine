import { Queue, Worker, JobsOptions } from 'bullmq';
import { redis } from '../db/redis';
import { Order, OrderStatus, WebSocketMessage } from '../models/types';
import { MockDexRouter } from './dexRouter';
import { updateOrder } from '../db/postgres';

// Use compatible WebSocket type
interface WebSocketConnection {
  socket: {
    send: (data: string) => void;
    readyState: number;
  };
}

export class QueueService {
  private orderQueue: Queue;
  private worker: Worker | null = null;
  private webSocketConnections: Map<string, WebSocketConnection> = new Map();
  private dex = new MockDexRouter();

  constructor() {
    this.orderQueue = new Queue('order-execution', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      } as JobsOptions,
    });
  }

  initWorker(processor: (order: Order) => Promise<void>, concurrency = 10) {
    if (this.worker) return;
    this.worker = new Worker(
      this.orderQueue.name,
      async (job) => {
        await processor(job.data as Order);
      },
      { connection: redis, concurrency }
    );

    // Log worker events
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err.message);
    });
  }

  async addOrder(order: Order): Promise<void> {
    await this.orderQueue.add('execute-order', order, { jobId: order.id });
  }

  registerWebSocket(orderId: string, connection: any): void {
    this.webSocketConnections.set(orderId, connection as WebSocketConnection);
  }

  unregisterWebSocket(orderId: string): void {
    this.webSocketConnections.delete(orderId);
  }

  async sendStatusUpdate(orderId: string, status: OrderStatus, data?: any): Promise<void> {
    const connection = this.webSocketConnections.get(orderId);
    const message: WebSocketMessage = { type: 'status_update', orderId, status, data };

    // Try to send via WebSocket if connected
    if (connection && connection.socket && connection.socket.readyState === 1) {
      try {
        connection.socket.send(JSON.stringify(message));
      } catch (err) {
        console.error(`Failed to send WS message for order ${orderId}:`, err);
      }
    }

    // Always persist status to database
    const updateData: any = { id: orderId, status, updatedAt: new Date() };
    
    if (data) {
      if (data.dexUsed) updateData.dexUsed = data.dexUsed;
      if (data.executedPrice !== undefined) updateData.executedPrice = data.executedPrice;
      if (data.txHash) updateData.txHash = data.txHash;
      if (data.amountOut !== undefined) updateData.amountOut = data.amountOut;
      if (data.error) updateData.error = data.error;
    }

    await updateOrder(updateData);
  }

  // High-level processor implementing the order lifecycle
  async processOrder(order: Order) {
    const { id, tokenIn, tokenOut, amountIn, slippage } = order;

    try {
      // Step 1: Routing - fetch quotes from both DEXs
      await this.sendStatusUpdate(id, 'routing');
      console.log(`[Order ${id}] Starting routing phase`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const quote = await this.dex.getBestQuote(tokenIn, tokenOut, amountIn);
      console.log(`[Order ${id}] Best quote from ${quote.dex}: ${quote.amountOut.toFixed(6)} ${tokenOut}`);

      // Step 2: Building - prepare transaction
      await this.sendStatusUpdate(id, 'building', {
        dexUsed: quote.dex,
        quotedPrice: quote.price,
        quotedAmountOut: quote.amountOut,
      });
      console.log(`[Order ${id}] Building transaction on ${quote.dex}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const minAmountOut = quote.amountOut * (1 - slippage);

      // Step 3: Submitted - send transaction
      await this.sendStatusUpdate(id, 'submitted');
      console.log(`[Order ${id}] Transaction submitted to ${quote.dex}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await this.dex.executeSwap(
        quote.dex,
        {
          id,
          tokenIn,
          tokenOut,
          amountIn,
          fee: quote.fee,
          slippage,
          minAmountOut,
        },
        quote.price
      );

      // Step 4: Confirmed - transaction successful
      await this.sendStatusUpdate(id, 'confirmed', {
        dexUsed: quote.dex,
        executedPrice: result.executedPrice,
        txHash: result.txHash,
        amountOut: result.amountOut,
      });
      console.log(`[Order ${id}] Confirmed! TxHash: ${result.txHash}`);
      
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[Order ${id}] Failed:`, error);
      
      await this.sendStatusUpdate(id, 'failed', { error });
    }
  }

  async getQueueMetrics() {
    const counts = await this.orderQueue.getJobCounts(
      'wait',
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
      'prioritized'
    );

    // Handle both 'wait' and 'waiting' for different BullMQ versions
    const waiting = (counts as any).wait ?? (counts as any).waiting ?? 0;

    return {
      waiting,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: (counts as any).paused ?? 0,
      prioritized: (counts as any).prioritized ?? 0,
    };
  }

  async close(): Promise<void> {
    console.log('Closing QueueService...');
    
    // Close worker first
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('Worker closed');
    }

    // Then close queue
    await this.orderQueue.close();
    console.log('Queue closed');
    
    // Clear WebSocket connections
    this.webSocketConnections.clear();
  }

  getQueue() {
    return this.orderQueue;
  }
  
  getWorker() {
    return this.worker;
  }
}