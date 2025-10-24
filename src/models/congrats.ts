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
  // ---- CORRECCIÓN AQUÍ: Permitir null ----
  sentAt: Date | null; // Indicamos que puede ser Date O null
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
      defaultValue: 0, // 0=pendiente, 1=éxito, 2=error
    },
    content: {
      type: DataTypes.TEXT, // Almacenará el PDF en base64 o mensaje de error
      allowNull: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true, // La base de datos permite null si no se envió o falló
    },
    // Sequelize añade createdAt y updatedAt automáticamente por defecto
  },
  {
    // Opciones adicionales del modelo si las necesitas
    // tableName: 'congrats', // Puedes especificar nombre de tabla si difiere
    // timestamps: true, // Asegura que createdAt/updatedAt se manejen
  },
);

// Sincronizar el modelo con la base de datos (Opcional: útil en desarrollo)
// En un entorno de producción, es mejor usar migraciones.
// async function syncDatabase() {
//   try {
//     await CongratsModel.sync({ alter: true }); // 'alter: true' intenta modificar la tabla si ya existe
//     console.log('Modelo Congrats sincronizado con la base de datos.');
//   } catch (error) {
//     console.error('Error al sincronizar el modelo Congrats:', error);
//   }
// }
// syncDatabase(); // Llama a la función para sincronizar al iniciar

export default CongratsModel;
