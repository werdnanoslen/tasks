import { DataTypes } from 'sequelize';

export function modelUser(sequelize) {
  const userAttributes = {
    username: { type: DataTypes.STRING, allowNull: false },
    hash: { type: DataTypes.STRING, allowNull: false },
    session: { type: DataTypes.STRING, allowNull: true },
  };

  const options = {
    defaultScope: {
      // exclude hash by default
      attributes: { exclude: ['hash'] },
    },
    scopes: {
      // include hash with this scope
      withHash: { attributes: {} },
    },
  };

  return sequelize.define('User', userAttributes, options);
}

export function modelTask(sequelize) {
  const taskAttributes = {
    id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
    position: { type: DataTypes.SMALLINT, allowNull: false }, //key idx_position
    data: { type: DataTypes.TEXT, allowNull: false },
    done: { type: DataTypes.TINYINT, allowNull: false, default: 0 },
    pinned: { type: DataTypes.TINYINT, allowNull: false, default: 0 },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  };

  return sequelize.define('Task', taskAttributes);
}
