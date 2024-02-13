import { DataTypes } from 'sequelize';

export type ListItem = {
  id: number;
  data: string;
  done: boolean;
};

export type Task = {
  position?: number;
  id: number;
  data: string | ListItem[];
  done: boolean;
  pinned: boolean;
  chosen?: boolean;
  user_id?: number;
};

export type Credentials = {
  username: string;
  password: string;
};

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
