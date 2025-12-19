const Boom = require('@hapi/boom');
const tokenService = require('../services/tokenService');

class TokenController {
  /**
   * Genera un nuevo token
   */
  async generateToken(request, h) {
    try {
      const token = await tokenService.createToken();
      
      return h.response({
        success: true,
        message: 'Token generado exitosamente',
        data: {
          token: token.token,
          expiresAt: token.expires_at
        }
      }).code(201);
    } catch (error) {
      console.error('Error al generar token:', error);
      throw Boom.internal('Error al generar token');
    }
  }

  /**
   * Valida un token
   */
  async validateToken(request, h) {
    try {
      const { token } = request.payload;

      if (!token || token.length !== 8) {
        throw Boom.badRequest('Token inválido: debe tener 8 dígitos');
      }

      const validation = await tokenService.validateToken(token);

      if (!validation.valid) {
        return h.response({
          success: false,
          valid: false,
          message: validation.message
        }).code(200);
      }

      return h.response({
        success: true,
        valid: true,
        message: 'Token válido',
        data: {
          token: validation.tokenData.token,
          createdAt: validation.tokenData.created_at,
          expiresAt: validation.tokenData.expires_at
        }
      }).code(200);
    } catch (error) {
      if (error.isBoom) throw error;
      console.error('Error al validar token:', error);
      throw Boom.internal('Error al validar token');
    }
  }

  /**
   * Marca un token como usado
   */
  async markTokenUsed(request, h) {
    try {
      const { token } = request.payload;

      if (!token || token.length !== 8) {
        throw Boom.badRequest('Token inválido');
      }

      const result = await tokenService.markTokenAsUsed(token);

      return h.response({
        success: true,
        message: 'Token marcado como usado',
        data: result
      }).code(200);
    } catch (error) {
      if (error.message.includes('Token no válido')) {
        throw Boom.badRequest(error.message);
      }
      console.error('Error al marcar token:', error);
      throw Boom.internal('Error al marcar token como usado');
    }
  }

  /**
   * Obtiene estadísticas de tokens
   */
  async getStats(request, h) {
    try {
      const stats = await tokenService.getTokenStats();
      
      return h.response({
        success: true,
        data: stats
      }).code(200);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw Boom.internal('Error al obtener estadísticas');
    }
  }

  /**
   * Health check
   */
  async healthCheck(request, h) {
    return h.response({
      success: true,
      service: 'ms-seguridad',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }).code(200);
  }
}

module.exports = new TokenController();