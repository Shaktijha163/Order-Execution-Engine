// // Test setup and global configuration
// import { initDB } from '../src/db/postgres';
// import { initRedis, redis } from '../src/db/redis';

// // Set test timeout
// jest.setTimeout(30000);

// // Initialize database and Redis before all tests
// beforeAll(async () => {
//   try {
//     await initDB();
//     await initRedis();
//     console.log('Test environment initialized');
//   } catch (error) {
//     console.error('Failed to initialize test environment:', error);
//     throw error;
//   }
// });

// // Clean up after all tests
// afterAll(async () => {
//   try {
//     await redis.quit();
//     console.log('Test environment cleaned up');
//   } catch (error) {
//     console.error('Failed to clean up test environment:', error);
//   }
// });

// Test setup and global configuration
// import { initDB } from '../src/db/postgres';
// import { initRedis, redis } from '../src/db/redis';
// import pool from '../src/db/postgres';

// // Set test timeout
// jest.setTimeout(30000);

// // Initialize database and Redis before all tests
// beforeAll(async () => {
//   try {
//     // Drop existing tables to ensure fresh schema
//     const client = await pool.connect();
//     try {
//       await client.query('DROP TABLE IF EXISTS orders CASCADE');
//       console.log('Dropped existing tables');
//     } finally {
//       client.release();
//     }
    
//     // Recreate tables with current schema
//     await initDB();
//     await initRedis();
//     console.log('Test environment initialized');
//   } catch (error) {
//     console.error('Failed to initialize test environment:', error);
//     throw error;
//   }
// });

// // Clean up after all tests
// afterAll(async () => {
//   try {
//     await redis.quit();
//     // Also close the pool connection
//     await pool.end();
//     console.log('Test environment cleaned up');
//   } catch (error) {
//     console.error('Failed to clean up test environment:', error);
//   }
// });

// Test setup and global configuration
// import { initDB } from '../src/db/postgres';
// import { initRedis, redis } from '../src/db/redis';
// import pool from '../src/db/postgres';

// // Set test timeout
// jest.setTimeout(30000);

// // Initialize database and Redis before all tests
// beforeAll(async () => {
//   try {
//     // Drop existing tables to ensure fresh schema
//     const client = await pool.connect();
//     try {
//       await client.query('DROP TABLE IF EXISTS orders CASCADE');
//       console.log('Dropped existing tables');
//     } finally {
//       client.release();
//     }
    
//     // Recreate tables with current schema
//     await initDB();
//     await initRedis();
//     console.log('Test environment initialized');
//   } catch (error) {
//     console.error('Failed to initialize test environment:', error);
//     throw error;
//   }
// });

// // Clean up after all tests
// afterAll(async () => {
//   try {
//     // Give background jobs time to finish
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     // Close connections
//     await redis.quit();
//     await pool.end();
    
//     console.log('Test environment cleaned up');
//   } catch (error) {
//     console.error('Failed to clean up test environment:', error);
//   }
// });


import { initDB } from '../src/db/postgres';
import { initRedis, redis } from '../src/db/redis';
import pool from '../src/db/postgres';

// Set test timeout
jest.setTimeout(30000);

// Determine if this is an integration test
const isIntegrationTest = expect.getState().testPath?.includes('integration');

// Initialize database and Redis before all tests (only for integration tests)
beforeAll(async () => {
  if (!isIntegrationTest) {
    console.log('Skipping DB/Redis initialization for unit tests');
    return;
  }

  try {
    // Drop existing tables to ensure fresh schema
    const client = await pool.connect();
    try {
      // Drop any ENUM types first (if they exist)
      await client.query('DROP TYPE IF EXISTS order_status CASCADE');
      await client.query('DROP TABLE IF EXISTS orders CASCADE');
      console.log('Dropped existing tables and types');
    } finally {
      client.release();
    }
    
    // Recreate tables with current schema
    await initDB();
    await initRedis();
    console.log('Test environment initialized');
  } catch (error) {
    console.error('Failed to initialize test environment:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  if (!isIntegrationTest) {
    return;
  }

  try {
    // Give background jobs MORE time to finish
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Close connections in order
    await redis.quit();
    await pool.end();
    
    console.log('Test environment cleaned up');
  } catch (error) {
    console.error('Failed to clean up test environment:', error);
  }
});