require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes/clienteRoutes');
const db = require('./config/database');
const { getRedisClient } = require('./config/redis');
const { getRabbitMQChannel } = require('./config/rabbitmq');
const parametroService = require('./services/parametroService');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3002,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  });

  // Registrar rutas
  server.route(routes);

  // Manejo de errores global
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    
    if (response.isBoom) {
      const error = response;
      const statusCode = error.output.statusCode;
      
      return h.response({
        success: false,
        error: {
          statusCode,
          message: error.message,
          details: error.output.payload.message
        }
      }).code(statusCode);
    }
    
    return h.continue;
  });

  // Verificar conexiones
  try {
    // PostgreSQL
    await db.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL establecida');

    // Redis
    await getRedisClient();
    console.log('✅ Conexión a Redis establecida');

    // RabbitMQ
    await getRabbitMQChannel();
    console.log('✅ Conexión a RabbitMQ establecida');

    // Cargar parámetros en Redis
    await parametroService.loadParametrosToRedis();
    
  } catch (error) {
    console.error('❌ Error al conectar con servicios:', error);
    process.exit(1);
  }

  await server.start();
  console.log(`🚀 MS Clientes corriendo en: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

init();