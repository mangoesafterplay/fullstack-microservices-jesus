const db = require('../config/database');
const { getRedisClient } = require('../config/redis');

class ParametroService {
  /**
   * Obtiene todos los parámetros de la BD y los carga en Redis
   */
  async loadParametrosToRedis() {
    try {
      const redisClient = await getRedisClient();
      
      const result = await db.query(
        'SELECT clave, valor, descripcion FROM parametros'
      );

      if (result.rows.length === 0) {
        console.warn('⚠️ No hay parámetros para cargar en Redis');
        return 0;
      }

      let loaded = 0;
      for (const param of result.rows) {
        await redisClient.set(
          `param:${param.clave}`,
          param.valor,
          { EX: 3600 } // Expira en 1 hora
        );
        loaded++;
      }

      console.log(`✅ ${loaded} parámetros cargados en Redis`);
      return loaded;
    } catch (error) {
      console.error('❌ Error al cargar parámetros en Redis:', error);
      throw error;
    }
  }

  /**
   * Obtiene un parámetro desde Redis
   */
  async getParametro(clave) {
    try {
      const redisClient = await getRedisClient();
      const valor = await redisClient.get(`param:${clave}`);
      
      if (valor === null) {
        console.warn(`⚠️ Parámetro ${clave} no encontrado en Redis`);
        // Intentar cargar desde BD
        const result = await db.query(
          'SELECT valor FROM parametros WHERE clave = $1',
          [clave]
        );
        
        if (result.rows.length > 0) {
          const dbValor = result.rows[0].valor;
          await redisClient.set(`param:${clave}`, dbValor, { EX: 3600 });
          return dbValor;
        }
        
        return null;
      }
      
      return valor;
    } catch (error) {
      console.error(`❌ Error al obtener parámetro ${clave}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si el envío de correos está habilitado
   */
  async isEnvioCorreosEnabled() {
    try {
      const valor = await this.getParametro('ENVIO_CORREOS_ENABLED');
      return valor === 'true';
    } catch (error) {
      console.error('❌ Error al verificar parámetro de correos:', error);
      return false; // Por defecto deshabilitado si hay error
    }
  }

  /**
   * Actualiza un parámetro en BD y Redis
   */
  async updateParametro(clave, nuevoValor) {
    try {
      const result = await db.query(
        `UPDATE parametros 
         SET valor = $1, updated_at = NOW() 
         WHERE clave = $2 
         RETURNING *`,
        [nuevoValor, clave]
      );

      if (result.rows.length === 0) {
        throw new Error(`Parámetro ${clave} no encontrado`);
      }

      // Actualizar en Redis
      const redisClient = await getRedisClient();
      await redisClient.set(`param:${clave}`, nuevoValor, { EX: 3600 });

      console.log(`✅ Parámetro ${clave} actualizado`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error al actualizar parámetro:', error);
      throw error;
    }
  }
}

module.exports = new ParametroService();