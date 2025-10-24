import { runBirthdayCongratsJob } from '../controllers/congrats.js';
import sequelize from '../db.js';
// Importamos modelos para asegurar que Sequelize los cargue
import AcademicModel from '../models/academic.js';
import CongratsModel from '../models/congrats.js';

async function startWorkerJob() {
  try {
    console.log('Worker: Autenticando conexión a la DB...');
    await sequelize.authenticate();
    console.log('Worker: Conexión establecida. Iniciando trabajo...');

    await runBirthdayCongratsJob();
    console.log('Worker: Tarea finalizada con éxito.');
  } catch (error) {
    console.error('Worker: Error CRÍTICO en la ejecución de la tarea:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Worker: Conexión a DB cerrada.');
    process.exit(0);
  }
}

startWorkerJob();
