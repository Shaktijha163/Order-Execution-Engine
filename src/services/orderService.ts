import { Order, OrderRequest } from '../models/types';
import { generateId } from '../utils/helpers';
import { saveOrder, getOrder as getOrderFromDB } from '../db/postgres';

export class OrderService {
  async createOrder(orderRequest: OrderRequest): Promise<Order> {
    const order: Order = {
      id: generateId(),
      userId: orderRequest.userId,
      type: orderRequest.type,
      tokenIn: orderRequest.tokenIn,
      tokenOut: orderRequest.tokenOut,
      amountIn: orderRequest.amountIn,
      slippage: orderRequest.slippage ?? 0.01, // Default 1% slippage
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only save to database - queueing handled by route handler
    await saveOrder(order);

    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return getOrderFromDB(orderId);
  }
}