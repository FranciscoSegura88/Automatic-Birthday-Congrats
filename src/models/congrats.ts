import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import sequelize from '../db.js';

export interface CongratsModel
  extends Model<
    InferAttributes<CongratsModel>,
    InferCreationAttributes<CongratsModel>
  > {
  id: CreationOptional<number>;
  userId: number;
  status: number;
  content: string;
  sentAt: Date;
}

const CongratsModel = sequelize.define<CongratsModel>(
  'Congrats',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {},
);

export default CongratsModel;
