const db = require('../config/database');

class TokenService {
  /**
   * Genera un token aleatorio de 8 dígitos
   */
  generateToken() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  /**
   * Crea un nuevo token en la base de datos
   */
  async createToken() {
    let token;
    let created = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!created && attempts < maxAttempts) {
      try {
        token = this.generateToken();
        
        const result = await db.query(
          `INSERT INTO tokens (token, is_valid, expires_at) 
           VALUES ($1, true, NOW() + INTERVAL '1 hour') 
           RETURNING id, token, created_at, expires_at`,
          [token]
        );

        created = true;
        return result.rows[0];
      } catch (error) {
        if (error.code === '23505') { // Código de violación de unicidad
          attempts++;
          console.log(`Token duplicado, intento ${attempts}/${maxAttempts}`);
        } else {
          throw error;
        }
      }
    }

    throw new Error('No se pudo generar un token único después de varios intentos');
  }

  /**
   * Valida un token
   */
  async validateToken(token) {
    const result = await db.query(
      `SELECT id, token, is_valid, expires_at, used_at 
       FROM tokens 
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: 'Token no existe' };
    }

    const tokenData = result.rows[0];

    if (!tokenData.is_valid) {
      return { valid: false, message: 'Token ya fue usado' };
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      return { valid: false, message: 'Token expirado' };
    }

    return { valid: true, tokenData };
  }

  /**
   * Marca un token como usado
   */
  async markTokenAsUsed(token) {
    const result = await db.query(
      `UPDATE tokens 
       SET is_valid = false, used_at = NOW() 
       WHERE token = $1 AND is_valid = true 
       RETURNING id, token, used_at`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Token no válido o ya usado');
    }

    return result.rows[0];
  }

  /**
   * Obtiene estadísticas de tokens
   */
  async getTokenStats() {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_valid = true AND expires_at > NOW()) as validos,
        COUNT(*) FILTER (WHERE is_valid = false) as usados,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expirados
       FROM tokens`
    );

    return result.rows[0];
  }
}

module.exports = new TokenService();