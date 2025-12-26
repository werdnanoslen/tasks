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
  image?: string;
};

export function modelTask(sequelize) {
  const taskAttributes = {
    id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
    position: { type: DataTypes.SMALLINT, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: false },
    done: { type: DataTypes.TINYINT, allowNull: false, default: 0 },
    pinned: { type: DataTypes.TINYINT, allowNull: false, default: 0 },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    image: { type: DataTypes.TEXT, allowNull: true },
  };

  const Task = sequelize.define('Task', taskAttributes);
  
  // Add indexes for better query performance
  Task.addIndex = async function() {
    try {
      // Check if idx_user_position exists
      const [rows] = await sequelize.query(
        "SHOW INDEX FROM Tasks WHERE Key_name = 'idx_user_position'"
      );
      if (rows.length === 0) {
        await sequelize.query('CREATE INDEX idx_user_position ON Tasks(user_id, position)');
      }
    } catch (err) {
      // Index might already exist, ignore error
      if (!err.message.includes('Duplicate key name')) {
        console.error('Error creating idx_user_position:', err.message);
      }
    }
    
    try {
      // Check if idx_user_done exists
      const [rows] = await sequelize.query(
        "SHOW INDEX FROM Tasks WHERE Key_name = 'idx_user_done'"
      );
      if (rows.length === 0) {
        await sequelize.query('CREATE INDEX idx_user_done ON Tasks(user_id, done)');
      }
    } catch (err) {
      // Index might already exist, ignore error
      if (!err.message.includes('Duplicate key name')) {
        console.error('Error creating idx_user_done:', err.message);
      }
    }
  };
  
  return Task;
}
