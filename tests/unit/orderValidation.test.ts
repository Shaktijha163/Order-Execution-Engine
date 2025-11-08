import { OrderRequestSchema } from '../../src/models/order';

describe('Order Validation', () => {
  describe('OrderRequestSchema', () => {
    it('should validate a correct order request', () => {
      const validOrder = {
        userId: 'user123',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1.5,
        slippage: 0.01,
      };

      const result = OrderRequestSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should apply default slippage if not provided', () => {
      const orderWithoutSlippage = {
        userId: 'user123',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1.5,
      };

      const result = OrderRequestSchema.parse(orderWithoutSlippage);
      expect(result.slippage).toBe(0.01);
    });

    it('should reject empty userId', () => {
      const invalidOrder = {
        userId: '',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1.5,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject negative amountIn', () => {
      const invalidOrder = {
        userId: 'user123',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: -1,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject zero amountIn', () => {
      const invalidOrder = {
        userId: 'user123',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 0,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject slippage > 1', () => {
      const invalidOrder = {
        userId: 'user123',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        slippage: 1.5,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject negative slippage', () => {
      const invalidOrder = {
        userId: 'user123',
        type: 'market' as const,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        slippage: -0.1,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject missing tokenIn', () => {
      const invalidOrder = {
        userId: 'user123',
        type: 'market' as const,
        tokenOut: 'USDC',
        amountIn: 1,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject wrong order type', () => {
      const invalidOrder = {
        userId: 'user123',
        type: 'limit' as any,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
      };

      const result = OrderRequestSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });
});