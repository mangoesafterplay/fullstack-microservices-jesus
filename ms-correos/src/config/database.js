const mysql = require('mysql2/promise');

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'correo_user',
      password: process.env.DB_PASSWORD || 'correo123',
      database: process.env.DB_NAME || 'correos_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
};

const query = async (sql, params) => {
  const connection = getPool();
  const [results] = await connection.execute(sql, params);
  return results;
};

module.exports = {
  query,
  getPool
};