require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes/tokenRoutes');
const db = require('./config/database');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3001,
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

  // Verificar conexión a la base de datos
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL establecida');
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error);
    process.exit(1);
  }

  await server.start();
  console.log(`🚀 MS Seguridad corriendo en: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

init();