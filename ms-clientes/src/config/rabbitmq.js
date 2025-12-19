const amqp = require('amqplib');

let connection = null;
let channel = null;

const QUEUE_NAME = 'correos_queue';

const getRabbitMQChannel = async () => {
  if (channel) {
    return channel;
  }

  try {
    const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    
    connection = await amqp.connect(rabbitmqUrl);
    
    connection.on('error', (err) => {
      console.error('❌ Error de conexión RabbitMQ:', err);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.warn('⚠️ Conexión RabbitMQ cerrada');
      channel = null;
      connection = null;
    });

    channel = await connection.createChannel();
    
    // Asegurar que la cola existe
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });

    console.log('✅ Canal de RabbitMQ creado exitosamente');
    
    return channel;
  } catch (error) {
    console.error('❌ Error al conectar con RabbitMQ:', error);
    throw error;
  }
};

const publishToQueue = async (queueName, message) => {
  try {
    const ch = await getRabbitMQChannel();
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    const sent = ch.sendToQueue(queueName, messageBuffer, {
      persistent: true
    });

    if (sent) {
      console.log(`📨 Mensaje enviado a la cola ${queueName}`);
      return true;
    } else {
      console.warn(`⚠️ Cola ${queueName} llena, mensaje no enviado`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al publicar mensaje:', error);
    throw error;
  }
};

const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('✅ Conexión RabbitMQ cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión RabbitMQ:', error);
  }
};

module.exports = {
  getRabbitMQChannel,
  publishToQueue,
  closeConnection,
  QUEUE_NAME
};