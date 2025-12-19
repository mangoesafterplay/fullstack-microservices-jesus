const Joi = require('joi');
const tokenController = require('../controllers/tokenController');

const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: tokenController.healthCheck,
    options: {
      description: 'Health check del microservicio',
      tags: ['api', 'health']
    }
  },
  {
    method: 'POST',
    path: '/api/tokens/generate',
    handler: tokenController.generateToken,
    options: {
      description: 'Genera un nuevo token de seguridad',
      tags: ['api', 'tokens'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  },
  {
    method: 'POST',
    path: '/api/tokens/validate',
    handler: tokenController.validateToken,
    options: {
      description: 'Valida un token de seguridad',
      tags: ['api', 'tokens'],
      validate: {
        payload: Joi.object({
          token: Joi.string().length(8).required()
            .description('Token de 8 dígitos a validar')
        })
      },
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  },
  {
    method: 'POST',
    path: '/api/tokens/mark-used',
    handler: tokenController.markTokenUsed,
    options: {
      description: 'Marca un token como usado',
      tags: ['api', 'tokens'],
      validate: {
        payload: Joi.object({
          token: Joi.string().length(8).required()
            .description('Token de 8 dígitos a marcar como usado')
        })
      },
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  },
  {
    method: 'GET',
    path: '/api/tokens/stats',
    handler: tokenController.getStats,
    options: {
      description: 'Obtiene estadísticas de tokens',
      tags: ['api', 'tokens'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  }
];

module.exports = routes;