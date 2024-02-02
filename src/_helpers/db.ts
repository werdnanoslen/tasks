import mysql2, { PoolOptions } from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import model from '../users/user.model.js';

class DB {
  static User: any;
}

export default DB;

// TODO move into initialize after refactor
const poolOptions: PoolOptions = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};
const pool = mysql2.createPool(poolOptions);

initialize();

export async function initialize() {
  await pool.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\`;`
  );
  const sequelize = new Sequelize(
    poolOptions.database!,
    poolOptions.user!,
    poolOptions.password,
    {
      dialect: 'mysql',
    }
  );
  DB.User = model(sequelize);
  await sequelize.sync();
}

// TODO remove as extra after refactor
export function query(sql: string, values?): Promise<any> {
  return new Promise((resolve, reject) => {
    pool.query(sql, values).catch(reject).then(resolve);
  });
}
