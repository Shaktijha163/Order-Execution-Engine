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

// Use REDIS_URL if available (Railway provides this)
export const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: { rejectUnauthorized: false } // Required for Railway Redis
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

export const initRedis = async () => {
  try {
    await redis.ping();
    console.log(' Redis connected successfully');
  } catch (error) {
    console.error(' Redis connection failed:', error);
    throw error;
  }
};