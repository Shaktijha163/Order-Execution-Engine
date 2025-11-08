import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const generateMockTxHash = (): string => 
  `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)).join('')}`;

export const calculateAmountOut = (amountIn: number, price: number, fee: number): number => {
  return amountIn * price * (1 - fee);
};