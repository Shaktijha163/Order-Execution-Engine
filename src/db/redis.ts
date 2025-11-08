// import Redis from 'ioredis';

// export const redis = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   password: process.env.REDIS_PASSWORD,
//   maxRetriesPerRequest: null, // Required for BullMQ
// });

// export const initRedis = async () => {
//   try {
//     await redis.ping();
//     console.log('Redis connected successfully');
//   } catch (error) {
//     console.error('Redis connection failed:', error);
//     throw error;
//   }
// };

import Redis from 'ioredis';

// Parse Railway Redis URL and configure appropriately
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    // Railway provides REDIS_URL
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 30000,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
  
  // Fallback to individual env vars
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  });
};

export const redis = createRedisClient();

export const initRedis = async () => {
  try {
    await redis.ping();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};