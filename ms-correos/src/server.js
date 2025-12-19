require('dotenv').config();
const Hapi = require('@hapi/hapi');
const { connectRabbitMQ, getChannel, QUEUE_NAME } = require('./config/rabbitmq');
const correoService = require('./services/correoService');
const db = require('./config/database');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3003,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  });

  // Rutas básicas
  server.route([
    {
      method: 'GET',
      path: '/health',
      handler: (request, h) => {
        return h.response({
          success: true,
          service: 'ms-correos',
          status: 'healthy',
          timestamp: new Date().toISOString()
        }).code(200);
      }
    },
    {
      method: 'GET',
      path: '/api/correos/historial',
      handler: async (request, h) => {
        try {
          const { limit = 50, offset = 0 } = request.query;
          const correos = await correoService.getHistorialCorreos(
            parseInt(limit),
            parseInt(offset)
          );

          return h.response({
            success: true,
            data: correos
          }).code(200);
        } catch (error) {
          return h.response({
            success: false,
            error: error.message
          }).code(500);
        }
      }
    },
    {
      method: 'GET',
      path: '/api/correos/stats',
      handler: async (request, h) => {
        try {
          const stats = await correoService.getEstadisticas();

          return h.response({
            success: true,
            data: stats
          }).code(200);
        } catch (error) {
          return h.response({
            success: false,
            error: error.message
          }).code(500);
        }
      }
    }
  ]);

  // Verificar conexión a MySQL
  try {
    const pool = db.getPool();
    await pool.query('SELECT 1');
    console.log('✅ Conexión a MySQL establecida');
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error);
    process.exit(1);
  }

  // Conectar a RabbitMQ y configurar consumidor
  try {
    await connectRabbitMQ();
    const channel = getChannel();

    if (channel) {
      // Configurar prefetch para procesar un mensaje a la vez
      await channel.prefetch(1);

      // Consumir mensajes de la cola
      await channel.consume(QUEUE_NAME, async (message) => {
        if (message !== null) {
          try {
            console.log('📩 Mensaje recibido de la cola');
            
            await correoService.procesarMensajeCorreo(message);
            
            // Confirmar que el mensaje fue procesado
            channel.ack(message);
            console.log('✅ Mensaje confirmado (ACK)');
          } catch (error) {
            console.error('❌ Error al procesar mensaje:', error);
            
            // Rechazar el mensaje y reenviarlo a la cola
            channel.nack(message, false, true);
            console.warn('⚠️ Mensaje rechazado (NACK) y reenviado');
          }
        }
      });

      console.log(`🐰 Escuchando mensajes en la cola: ${QUEUE_NAME}`);
    }
  } catch (error) {
    console.error('❌ Error al configurar RabbitMQ consumer:', error);
    process.exit(1);
  }

  await server.start();
  console.log(`🚀 MS Correos corriendo en: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM recibido, cerrando servidor...');
  const { closeConnection } = require('./config/rabbitmq');
  await closeConnection();
  process.exit(0);
});

init();