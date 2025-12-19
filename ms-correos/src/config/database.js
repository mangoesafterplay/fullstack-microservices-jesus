const mysql = require('mysql2/promise');

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
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