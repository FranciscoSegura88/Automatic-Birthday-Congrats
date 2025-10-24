import dayjs from 'dayjs';
import AcademicModel from './models/academic.js';
import sequelize from './db.js';

async function seedDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexion a la base de datos establecida.');

    await AcademicModel.sync({ alter: true });

    const todayMonthDay = dayjs().format('-MM-DD');
    const lastYear = dayjs().subtract(1, 'year').year();
    const birthdateToday = `${lastYear}${todayMonthDay}`;

    const [academic, created] = await AcademicModel.upsert({
      id: 9999,
      firstName: 'Eduardo',
      lastName: 'Gonzalez',
      gender: 'M',
      enabled: true,
      degree: 'Ing.',
      email: 'eduardogonzalezit021@gmail.com',
      birthdate: new Date(birthdateToday),
      department: 'Sistemas',
    });

    if (created) {
      console.log(
        `Usuario de prueba creado: ${academic.firstName} (Cumpleaños: ${birthdateToday})`,
      );
    } else {
      console.log(
        `Usuario de prueba actualizado: ${academic.firstName} (Cumpleaños: ${birthdateToday})`,
      );
    }
  } catch (error) {
    console.error('Error al sembrar la base de datos: ', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
