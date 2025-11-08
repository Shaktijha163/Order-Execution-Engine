import { Queue } from 'bullmq';
import { Order } from '../models/types';
import { QueueService } from '../services/queueService';

export class OrderProcessor {
  constructor(private queue: Queue, private queueService: QueueService) {}

  start(concurrency = 10) {
    this.queueService.initWorker(async (order: Order) => {
      await this.queueService.processOrder(order);
    }, concurrency);
  }
}
