const Boom = require('@hapi/boom');
const clienteService = require('../services/clienteService');

class ClienteController {
  /**
   * Registra un nuevo cliente
   */
  async registerCliente(request, h) {
    try {
      const { token, ...clienteData } = request.payload;

      if (!token || token.length !== 8) {
        throw Boom.badRequest('Token inválido: debe tener 8 dígitos');
      }

      const cliente = await clienteService.registerCliente(clienteData, token);

      return h.response({
        success: true,
        message: 'Cliente registrado exitosamente',
        data: cliente
      }).code(201);
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      
      if (error.message.includes('Token')) {
        throw Boom.unauthorized(error.message);
      }
      
      if (error.message.includes('ya está registrado')) {
        throw Boom.conflict(error.message);
      }
      
      if (error.message.includes('mayor de edad')) {
        throw Boom.badRequest(error.message);
      }

      throw Boom.internal('Error al registrar cliente');
    }
  }

  /**
   * Obtiene un cliente por ID
   */
  async getCliente(request, h) {
    try {
      const { id } = request.params;
      const cliente = await clienteService.getClienteById(id);

      return h.response({
        success: true,
        data: cliente
      }).code(200);
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      
      if (error.message.includes('no encontrado')) {
        throw Boom.notFound(error.message);
      }

      throw Boom.internal('Error al obtener cliente');
    }
  }

  /**
   * Obtiene todos los clientes
   */
  async getAllClientes(request, h) {
    try {
      const { limit = 50, offset = 0 } = request.query;
      const clientes = await clienteService.getAllClientes(
        parseInt(limit),
        parseInt(offset)
      );

      return h.response({
        success: true,
        data: clientes,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: clientes.length
        }
      }).code(200);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw Boom.internal('Error al obtener clientes');
    }
  }

  /**
   * Health check
   */
  async healthCheck(request, h) {
    return h.response({
      success: true,
      service: 'ms-clientes',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }).code(200);
  }
}

module.exports = new ClienteController();