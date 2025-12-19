const db = require('../config/database');

class CorreoService {
  /**
   * Registra un correo en la base de datos
   */
  async registrarCorreo(correoData) {
    try {
      const {
        destinatario_email,
        destinatario_nombre,
        asunto,
        mensaje,
        cliente_id,
        metadata
      } = correoData;

      const result = await db.query(
        `INSERT INTO correos_enviados 
         (destinatario_email, destinatario_nombre, asunto, mensaje, cliente_id, estado, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          destinatario_email,
          destinatario_nombre,
          asunto,
          mensaje,
          cliente_id || null,
          'enviado',
          JSON.stringify(metadata || {})
        ]
      );

      console.log(`✅ Correo registrado con ID: ${result.insertId}`);
      
      return {
        id: result.insertId,
        destinatario_email,
        destinatario_nombre,
        asunto,
        estado: 'enviado'
      };
    } catch (error) {
      console.error('❌ Error al registrar correo:', error);
      
      // Intentar registrar como fallido
      try {
        await db.query(
          `INSERT INTO correos_enviados 
           (destinatario_email, destinatario_nombre, asunto, mensaje, estado, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            correoData.destinatario_email,
            correoData.destinatario_nombre,
            correoData.asunto,
            correoData.mensaje,
            'fallido',
            JSON.stringify({ error: error.message })
          ]
        );
      } catch (logError) {
        console.error('❌ Error al registrar correo fallido:', logError);
      }
      
      throw error;
    }
  }

  /**
   * Procesa un mensaje de correo desde RabbitMQ
   */
  async procesarMensajeCorreo(message) {
    try {
      const correoData = JSON.parse(message.content.toString());
      
      console.log('📧 Procesando correo para:', correoData.destinatario_email);
      
      // Simular envío de correo (en producción se usaría un servicio real)
      await this.simularEnvioCorreo(correoData);
      
      // Registrar en base de datos
      const resultado = await this.registrarCorreo(correoData);
      
      console.log('✅ Correo procesado exitosamente');
      return resultado;
    } catch (error) {
      console.error('❌ Error al procesar mensaje de correo:', error);
      throw error;
    }
  }

  /**
   * Simula el envío real de un correo
   */
  async simularEnvioCorreo(correoData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`
╔════════════════════════════════════════════════════════╗
║           📧 CORREO SIMULADO (NO ENVIADO)             ║
╠════════════════════════════════════════════════════════╣
║ Para: ${correoData.destinatario_email.padEnd(46)}║
║ Nombre: ${correoData.destinatario_nombre.padEnd(44)}║
║ Asunto: ${correoData.asunto.padEnd(44)}║
╠════════════════════════════════════════════════════════╣
║ Mensaje:                                               ║
║ ${correoData.mensaje.substring(0, 52).padEnd(52)}║
╚════════════════════════════════════════════════════════╝
        `);
        resolve();
      }, 500);
    });
  }

  /**
   * Obtiene el historial de correos enviados
   */
  async getHistorialCorreos(limit = 50, offset = 0) {
    try {
      const correos = await db.query(
        `SELECT * FROM correos_enviados 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return correos;
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de correos
   */
  async getEstadisticas() {
    try {
      const stats = await db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviados,
          COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as fallidos,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
         FROM correos_enviados`
      );

      return stats[0];
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

module.exports = new CorreoService();