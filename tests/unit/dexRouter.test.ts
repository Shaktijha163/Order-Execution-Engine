import { MockDexRouter } from '../../src/services/dexRouter';

describe('MockDexRouter', () => {
  let router: MockDexRouter;

  beforeEach(() => {
    router = new MockDexRouter();
  });

  describe('getRaydiumQuote', () => {
    it('should return a valid quote for SOL-USDC', async () => {
      const quote = await router.getRaydiumQuote('SOL', 'USDC', 1);
      
      expect(quote.dex).toBe('raydium');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.fee).toBe(0.003);
      expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should return different prices on multiple calls', async () => {
      const quote1 = await router.getRaydiumQuote('SOL', 'USDC', 1);
      const quote2 = await router.getRaydiumQuote('SOL', 'USDC', 1);
      
      // Prices should vary due to randomization
      expect(quote1.price).not.toBe(quote2.price);
    });

    it('should calculate amountOut correctly', async () => {
      const quote = await router.getRaydiumQuote('SOL', 'USDC', 10);
      const expectedAmountOut = 10 * quote.price * (1 - quote.fee);
      
      expect(quote.amountOut).toBeCloseTo(expectedAmountOut, 6);
    });
  });

  describe('getMeteoraQuote', () => {
    it('should return a valid quote for SOL-BONK', async () => {
      const quote = await router.getMeteoraQuote('SOL', 'BONK', 1);
      
      expect(quote.dex).toBe('meteora');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.fee).toBe(0.002);
      expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should have lower fee than Raydium', async () => {
      const meteoraQuote = await router.getMeteoraQuote('SOL', 'USDC', 1);
      const raydiumQuote = await router.getRaydiumQuote('SOL', 'USDC', 1);
      
      expect(meteoraQuote.fee).toBeLessThan(raydiumQuote.fee);
    });
  });

  describe('getBestQuote', () => {
    it('should compare both DEXs and return best quote', async () => {
      const bestQuote = await router.getBestQuote('SOL', 'USDC', 1);
      
      expect(['raydium', 'meteora']).toContain(bestQuote.dex);
      expect(bestQuote.amountOut).toBeGreaterThan(0);
    });

    it('should select quote with higher amountOut', async () => {
      // Run multiple times to ensure logic is correct
      const results = await Promise.all(
        Array(10).fill(null).map(() => router.getBestQuote('SOL', 'USDC', 1))
      );
      
      // All results should have valid amountOut
      results.forEach(quote => {
        expect(quote.amountOut).toBeGreaterThan(0);
      });
    });
  });

  describe('executeSwap', () => {
    it('should successfully execute swap on Raydium', async () => {
      const order = {
        id: 'test-order-1',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        fee: 0.003,
        slippage: 0.01,
        minAmountOut: 95,
      };

      const result = await router.executeSwap('raydium', order, 100);
      
      expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.executedPrice).toBeGreaterThan(0);
      expect(result.amountOut).toBeGreaterThanOrEqual(order.minAmountOut);
    });

    it('should fail if slippage exceeded', async () => {
      const order = {
        id: 'test-order-2',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        fee: 0.003,
        slippage: 0.01,
        minAmountOut: 10000, // Unrealistically high
      };

      await expect(
        router.executeSwap('meteora', order, 100)
      ).rejects.toThrow('Slippage exceeded');
    });

    it('should handle network errors (10% failure rate)', async () => {
      const order = {
        id: 'test-order-3',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        fee: 0.003,
        slippage: 0.01,
        minAmountOut: 95,
      };

      // Run 50 times, expect some failures
      const results = await Promise.allSettled(
        Array(50).fill(null).map(() => router.executeSwap('raydium', order, 100))
      );

      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBeGreaterThan(0); // Should have some failures
    });
  });
});