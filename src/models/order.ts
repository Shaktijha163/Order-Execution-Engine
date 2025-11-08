import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const OrderRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.literal('market'),
  tokenIn: z.string().min(1, 'Token in is required'),
  tokenOut: z.string().min(1, 'Token out is required'),
  amountIn: z.number().positive('Amount must be positive'),
  slippage: z.number().min(0).max(1).optional().default(0.01), 
});

export const OrderRequestJsonSchema = zodToJsonSchema(OrderRequestSchema, {
  name: 'OrderRequest',
});

export type OrderRequest = z.infer<typeof OrderRequestSchema>;