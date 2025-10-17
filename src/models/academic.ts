import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import sequelize from '../db.js';

export interface AcademicModel
  extends Model<
    InferAttributes<AcademicModel>,
    InferCreationAttributes<AcademicModel>
  > {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  enabled: boolean;
  degree: string;
  email: string;
  birthdate: Date;
  department?: string;
}

const AcademicModel = sequelize.define<AcademicModel>(
  'Academic',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    birthdate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {},
);

export default AcademicModel;
