import { Pool } from 'pg';
import { Order } from '../models/types';

// Use Railway Postgres env vars if available, otherwise fall back to local defaults
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        token_in VARCHAR(255) NOT NULL,
        token_out VARCHAR(255) NOT NULL,
        amount_in DECIMAL NOT NULL,
        slippage DECIMAL NOT NULL DEFAULT 0.01,
        amount_out DECIMAL,
        status VARCHAR(50) NOT NULL,
        dex_used VARCHAR(50),
        executed_price DECIMAL,
        tx_hash VARCHAR(255),
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    `);
    console.log(' Database initialized successfully');
  } catch (error) {
    console.error(' Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const saveOrder = async (order: Order): Promise<void> => {
  const query = `
    INSERT INTO orders (
      id, user_id, type, token_in, token_out, amount_in, slippage,
      amount_out, status, dex_used, executed_price, tx_hash, error, 
      created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `;
  await pool.query(query, [
    order.id,
    order.userId,
    order.type,
    order.tokenIn,
    order.tokenOut,
    order.amountIn,
    order.slippage,
    order.amountOut,
    order.status,
    order.dexUsed,
    order.executedPrice,
    order.txHash,
    order.error,
    order.createdAt,
    order.updatedAt,
  ]);
};

export const updateOrder = async (order: Partial<Order> & { id: string }): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (order.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(order.status);
  }
  if (order.amountOut !== undefined) {
    fields.push(`amount_out = $${paramCount++}`);
    values.push(order.amountOut);
  }
  if (order.dexUsed !== undefined) {
    fields.push(`dex_used = $${paramCount++}`);
    values.push(order.dexUsed);
  }
  if (order.executedPrice !== undefined) {
    fields.push(`executed_price = $${paramCount++}`);
    values.push(order.executedPrice);
  }
  if (order.txHash !== undefined) {
    fields.push(`tx_hash = $${paramCount++}`);
    values.push(order.txHash);
  }
  if (order.error !== undefined) {
    fields.push(`error = $${paramCount++}`);
    values.push(order.error);
  }

  fields.push(`updated_at = $${paramCount++}`);
  values.push(order.updatedAt || new Date());

  values.push(order.id);

  const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramCount}`;
  await pool.query(query, values);
};

export const getOrder = async (id: string): Promise<Order | null> => {
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    tokenIn: row.token_in,
    tokenOut: row.token_out,
    amountIn: parseFloat(row.amount_in),
    slippage: parseFloat(row.slippage),
    amountOut: row.amount_out ? parseFloat(row.amount_out) : undefined,
    status: row.status,
    dexUsed: row.dex_used,
    executedPrice: row.executed_price ? parseFloat(row.executed_price) : undefined,
    txHash: row.tx_hash,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export default pool;
