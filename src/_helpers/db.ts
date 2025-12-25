import mysql2, { PoolOptions } from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import { modelUser } from '../users/user.model.js';
import { modelTask } from '../tasks/task.model.js';

export default class DB {
  static User: any;
  static Task: any;
}

export async function initialize() {
  const poolOptions: PoolOptions = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };
  const pool = mysql2.createPool(poolOptions);
  await pool.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\`;`
  );
  const sequelize = new Sequelize(
    poolOptions.database!,
    poolOptions.user!,
    poolOptions.password,
    {
      dialect: 'mysql',
      logging: false,
    }
  );
  DB.User = modelUser(sequelize);
  DB.Task = modelTask(sequelize);
  await sequelize.sync();
  
  // Create indexes for better performance
  if (DB.Task.addIndex) {
    await DB.Task.addIndex();
  }
}
