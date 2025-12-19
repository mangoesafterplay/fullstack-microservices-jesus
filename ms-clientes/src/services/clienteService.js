const db = require('../config/database');
const parametroService = require('./parametroService');
const seguridadService = require('./seguridadService');
const { publishToQueue, QUEUE_NAME } = require('../config/rabbitmq');

class ClienteService {
  /**
   * Valida que el cliente sea mayor de edad
   */
  validateAge(fechaNacimiento) {
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  }

  /**
   * Registra un nuevo cliente
   */
  async registerCliente(clienteData, token) {
    // 1. Validar token con MS Seguridad
    console.log(`🔐 Validando token: ${token}`);
    const tokenValidation = await seguridadService.validateToken(token);
    
    if (!tokenValidation.success || !tokenValidation.valid) {
      throw new Error(tokenValidation.message || 'Token inválido');
    }

    // 2. Validar que sea mayor de edad
    if (!this.validateAge(clienteData.fecha_nacimiento)) {
      throw new Error('El cliente debe ser mayor de edad (18 años)');
    }

    // 3. Verificar si el documento ya existe
    const existingClient = await db.query(
      'SELECT id FROM clientes WHERE numero_documento = $1',
      [clienteData.numero_documento]
    );

    if (existingClient.rows.length > 0) {
      throw new Error('El número de documento ya está registrado');
    }

    // 4. Registrar cliente en BD
    const result = await db.query(
      `INSERT INTO clientes 
       (bono_bienvenida, tipo_documento, numero_documento, nombres, apellidos, 
        fecha_nacimiento, email, telefono, token_usado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        clienteData.bono_bienvenida || 0,
        clienteData.tipo_documento,
        clienteData.numero_documento,
        clienteData.nombres,
        clienteData.apellidos,
        clienteData.fecha_nacimiento,
        clienteData.email || null,
        clienteData.telefono || null,
        token
      ]
    );

    const cliente = result.rows[0];
    console.log(`✅ Cliente registrado con ID: ${cliente.id}`);

    // 5. Marcar token como usado
    try {
      await seguridadService.markTokenAsUsed(token);
    } catch (error) {
      console.warn('⚠️ No se pudo marcar el token como usado:', error.message);
    }

    // 6. Verificar si debe enviar correo (desde Redis)
    const envioHabilitado = await parametroService.isEnvioCorreosEnabled();
    
    if (envioHabilitado && clienteData.email) {
      console.log('📧 Envío de correos habilitado, enviando a cola...');
      
      const correoData = {
        destinatario_email: clienteData.email,
        destinatario_nombre: `${clienteData.nombres} ${clienteData.apellidos}`,
        asunto: '¡Bienvenido a nuestra plataforma!',
        mensaje: `Hola ${clienteData.nombres},\n\nGracias por registrarte. Tu bono de bienvenida es: S/ ${clienteData.bono_bienvenida || 0}.\n\n¡Disfruta de nuestros servicios!`,
        cliente_id: cliente.id,
        metadata: {
          tipo_documento: clienteData.tipo_documento,
          numero_documento: clienteData.numero_documento,
          bono_bienvenida: clienteData.bono_bienvenida
        }
      };

      // Enviar a RabbitMQ
      await publishToQueue(QUEUE_NAME, correoData);
    } else {
      console.log('📧 Envío de correos deshabilitado o sin email');
    }

    return cliente;
  }

  /**
   * Obtiene un cliente por ID
   */
  async getClienteById(id) {
    const result = await db.query(
      'SELECT * FROM clientes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    return result.rows[0];
  }

  /**
   * Obtiene todos los clientes
   */
  async getAllClientes(limit = 50, offset = 0) {
    const result = await db.query(
      'SELECT * FROM clientes ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return result.rows;
  }
}

module.exports = new ClienteService();