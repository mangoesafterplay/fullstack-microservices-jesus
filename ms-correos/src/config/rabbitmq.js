const amqp = require('amqplib');

const QUEUE_NAME = 'correos_queue';

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;
    
    connection = await amqp.connect(rabbitmqUrl);
    
    connection.on('error', (err) => {
      console.error('❌ Error de conexión RabbitMQ:', err);
    });

    connection.on('close', () => {
      console.warn('⚠️ Conexión RabbitMQ cerrada. Reconectando...');
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();
    
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });

    console.log('✅ Conectado a RabbitMQ, esperando mensajes...');
    
    return channel;
  } catch (error) {
    console.error('❌ Error al conectar con RabbitMQ:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
};

const getChannel = () => channel;

const closeConnection = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('✅ Conexión RabbitMQ cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión:', error);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  closeConnection,
  QUEUE_NAME
};