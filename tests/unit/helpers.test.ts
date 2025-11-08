import { generateId, generateMockTxHash, calculateAmountOut, sleep } from '../../src/utils/helpers';

describe('Utility Helpers', () => {
  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array(100).fill(null).map(() => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('generateMockTxHash', () => {
    it('should generate a valid transaction hash', () => {
      const txHash = generateMockTxHash();
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should generate unique hashes', () => {
      const hashes = new Set(Array(100).fill(null).map(() => generateMockTxHash()));
      expect(hashes.size).toBe(100);
    });
  });

  describe('calculateAmountOut', () => {
    it('should calculate output amount correctly', () => {
      const result = calculateAmountOut(100, 2, 0.01);
      expect(result).toBeCloseTo(198, 2); // 100 * 2 * (1 - 0.01) = 198
    });

    it('should handle zero fee', () => {
      const result = calculateAmountOut(100, 2, 0);
      expect(result).toBe(200);
    });

    it('should handle high fees', () => {
      const result = calculateAmountOut(100, 2, 0.5);
      expect(result).toBeCloseTo(100, 2); // 100 * 2 * 0.5 = 100
    });

    it('should handle decimal amounts', () => {
      const result = calculateAmountOut(0.5, 100, 0.003);
      expect(result).toBeCloseTo(49.85, 2);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(150); // Allow some tolerance
    });

    it('should resolve without errors', async () => {
      await expect(sleep(10)).resolves.toBeUndefined();
    });
  });
});