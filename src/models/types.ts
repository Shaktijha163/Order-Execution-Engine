export interface Order {
  id: string;
  userId: string;
  type: 'market' | 'limit' | 'sniper';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage: number; // Added: was missing but used in processOrder
  amountOut?: number;
  status: OrderStatus;
  dexUsed?: 'raydium' | 'meteora';
  executedPrice?: number;
  txHash?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'pending'
  | 'routing'
  | 'building'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface OrderRequest {
  userId: string;
  type: 'market';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage?: number;
}

export interface DexQuote {
  dex: 'raydium' | 'meteora';
  price: number;
  fee: number;
  amountOut: number;
}

export interface WebSocketMessage {
  type: 'status_update';
  orderId: string;
  status: OrderStatus;
  data?: {
    dexUsed?: string;
    executedPrice?: number;
    txHash?: string;
    error?: string;
    quotedPrice?: number;
    quotedAmountOut?: number;
    amountOut?: number;
  };
}