const Joi = require('joi');
const clienteController = require('../controllers/clienteController');

const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: clienteController.healthCheck,
    options: {
      description: 'Health check del microservicio',
      tags: ['api', 'health']
    }
  },
  {
    method: 'POST',
    path: '/api/clientes/register',
    handler: clienteController.registerCliente,
    options: {
      description: 'Registra un nuevo cliente',
      tags: ['api', 'clientes'],
      validate: {
        payload: Joi.object({
          token: Joi.string().length(8).required()
            .description('Token de seguridad de 8 dígitos'),
          bono_bienvenida: Joi.number().min(0).optional()
            .description('Monto del bono de bienvenida'),
          tipo_documento: Joi.string().valid('DNI', 'Carnet de extranjería').required()
            .description('Tipo de documento de identidad'),
          numero_documento: Joi.string().min(8).max(20).required()
            .description('Número de documento'),
          nombres: Joi.string().min(2).max(100).required()
            .description('Nombres del cliente'),
          apellidos: Joi.string().min(2).max(100).required()
            .description('Apellidos del cliente'),
          fecha_nacimiento: Joi.date().max('now').required()
            .description('Fecha de nacimiento (debe ser mayor de 18 años)'),
          email: Joi.string().email().optional()
            .description('Correo electrónico'),
          telefono: Joi.string().min(7).max(20).optional()
            .description('Número de teléfono')
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
    path: '/api/clientes/{id}',
    handler: clienteController.getCliente,
    options: {
      description: 'Obtiene un cliente por ID',
      tags: ['api', 'clientes'],
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required()
            .description('ID del cliente')
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
    path: '/api/clientes',
    handler: clienteController.getAllClientes,
    options: {
      description: 'Obtiene todos los clientes',
      tags: ['api', 'clientes'],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().min(1).max(100).default(50)
            .description('Cantidad de resultados'),
          offset: Joi.number().integer().min(0).default(0)
            .description('Desplazamiento para paginación')
        })
      },
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  }
];

module.exports = routes;