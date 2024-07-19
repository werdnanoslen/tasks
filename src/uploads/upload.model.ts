import { DataTypes } from 'sequelize';

export type Upload = {
  id: string;
  filename: string;
  path: string;
  user: string;
};

export function modelUpload(sequelize) {
  const uploadAttributes = {
    id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
    filename: { type: DataTypes.TEXT, allowNull: false },
    path: { type: DataTypes.TEXT, allowNull: false },
    user: { type: DataTypes.TEXT, allowNull: false },
  };

  return sequelize.define('Upload', uploadAttributes);
}
