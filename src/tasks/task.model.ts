import { DataTypes } from 'sequelize';

export type ListItem = {
  id: string;
  data: string;
  done: boolean;
};

export type Task = {
  position?: number;
  id: string;
  data: string | ListItem[];
  done: boolean;
  pinned: boolean;
  user_id?: string;
};

export type Credentials = {
  username: string;
  password: string;
};

export function modelTask(sequelize) {
  const taskAttributes = {
    id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
    position: { type: DataTypes.SMALLINT, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: false },
    done: { type: DataTypes.TINYINT, allowNull: false, default: 0 },
    pinned: { type: DataTypes.TINYINT, allowNull: false, default: 0 },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  };

  return sequelize.define('Task', taskAttributes);
}
