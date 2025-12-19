const axios = require('axios');

class SeguridadService {
  constructor() {
    this.baseURL = process.env.MS_SEGURIDAD_URL || 'http://localhost:3001';
  }

  /**
   * Valida un token con el microservicio de seguridad
   */
  async validateToken(token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/tokens/validate`,
        { token },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error al validar token con MS Seguridad:', error.message);
      
      if (error.response) {
        return {
          success: false,
          valid: false,
          message: error.response.data.message || 'Error al validar token'
        };
      }
      
      throw new Error('No se pudo conectar con el microservicio de seguridad');
    }
  }

  /**
   * Marca un token como usado
   */
  async markTokenAsUsed(token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/tokens/mark-used`,
        { token },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error al marcar token como usado:', error.message);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Error al marcar token'
        };
      }
      
      throw new Error('No se pudo conectar con el microservicio de seguridad');
    }
  }
}

module.exports = new SeguridadService();