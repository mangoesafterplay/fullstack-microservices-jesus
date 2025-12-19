const redis = require('redis');

let redisClient = null;

const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('❌ Demasiados reintentos de conexión a Redis');
          return new Error('Demasiados reintentos');
        }
        return retries * 100;
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('❌ Error de Redis:', err);
  });

  redisClient.on('connect', () => {
    console.log('🔴 Conectando a Redis...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis conectado y listo');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Reconectando a Redis...');
  });

  await redisClient.connect();
  
  return redisClient;
};

module.exports = { getRedisClient };