import { DexQuote } from '../models/types';
import { sleep, calculateAmountOut, generateMockTxHash } from '../utils/helpers';

export class MockDexRouter {
  private basePrices: Map<string, number> = new Map();

  constructor() {
    this.basePrices.set('SOL-USDC', 100);
    this.basePrices.set('USDC-SOL', 0.01);
    this.basePrices.set('SOL-BONK', 10000);
    this.basePrices.set('BONK-SOL', 0.0001);
  }

  private getBasePrice(tokenIn: string, tokenOut: string): number {
    const pair = `${tokenIn}-${tokenOut}`;
    const reversePair = `${tokenOut}-${tokenIn}`;
    return (
      this.basePrices.get(pair) ||
      (1 / (this.basePrices.get(reversePair) || 100)) ||
      100
    );
  }

  private isNativeSOL(sym: string) {
    return sym === 'SOL';
  }

  private async maybeWrapUnwrapSOL(tokenIn: string, tokenOut: string) {
    // Simulate wrap/unwrap overhead to show native handling
    if (this.isNativeSOL(tokenIn) || this.isNativeSOL(tokenOut)) {
      await sleep(150);
    }
  }

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await sleep(200 + Math.random() * 300);
    const basePrice = this.getBasePrice(tokenIn, tokenOut);
    const price = basePrice * (0.98 + Math.random() * 0.04);
    const fee = 0.003;
    return {
      dex: 'raydium',
      price,
      fee,
      amountOut: calculateAmountOut(amount, price, fee),
    };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await sleep(200 + Math.random() * 300);
    const basePrice = this.getBasePrice(tokenIn, tokenOut);
    const price = basePrice * (0.97 + Math.random() * 0.05);
    const fee = 0.002;
    return {
      dex: 'meteora',
      price,
      fee,
      amountOut: calculateAmountOut(amount, price, fee),
    };
  }

  async getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amount),
      this.getMeteoraQuote(tokenIn, tokenOut, amount),
    ]);

    const best = raydiumQuote.amountOut > meteoraQuote.amountOut ? raydiumQuote : meteoraQuote;
    // Log both quotes and the decision
    // Caller should include orderId in its own log lines
    console.log(
      JSON.stringify({
        event: 'routing_decision',
        raydium: raydiumQuote,
        meteora: meteoraQuote,
        chosen: best.dex,
      })
    );
    return best;
  }

  async executeSwap(
    dex: 'raydium' | 'meteora',
    order: { id: string; tokenIn: string; tokenOut: string; amountIn: number; fee: number; slippage: number; minAmountOut: number; },
    executedPriceHint?: number
  ): Promise<{ txHash: string; executedPrice: number; amountOut: number }> {
    console.log(`Executing swap on ${dex} for order ${order.id}`);
    await this.maybeWrapUnwrapSOL(order.tokenIn, order.tokenOut);

    // Simulate tx build/submit latency
    await sleep(2000 + Math.random() * 2000);

    if (Math.random() < 0.1) {
      throw new Error(`Swap execution failed on ${dex}: Simulated network error`);
    }

    // Use hint if provided, otherwise add a small variance around implied price
    const basePrice = executedPriceHint ?? this.getBasePrice(order.tokenIn, order.tokenOut) * (0.99 + Math.random() * 0.02);
    const executedPrice = basePrice;
    const amountOut = calculateAmountOut(order.amountIn, executedPrice, order.fee);

    if (amountOut < order.minAmountOut) {
      throw new Error(`Slippage exceeded: got ${amountOut.toFixed(6)} < min ${order.minAmountOut.toFixed(6)}`);
    }

    return {
      txHash: generateMockTxHash(),
      executedPrice,
      amountOut,
    };
  }
}
