import dayjs from 'dayjs';
import { type Request, type Response } from 'express';
import { Op, col, fn, where } from 'sequelize';
import Academic from '../models/academic.js';
import CongratsModel from '../models/congrats.js';
import { crearPDFFelicitacion } from '../services/generateCongratsPDF.js';

export async function createCongratsPDF(
  req: Request,
  res: Response,
): Promise<void> {
  const today = dayjs();

  const sendedCongrats = await CongratsModel.findAll({
    where: {
      sentAt: {
        [Op.gte]: today.startOf('day').toDate(),
        [Op.lte]: today.endOf('day').toDate(),
      },
    },
  });

  const sendedUserIds = sendedCongrats.map((c) => c.userId);

  const todaysBirthdays = await Academic.findAll({
    where: {
      enabled: true, // Using 'enabled' field from your model
      [Op.and]: [
        where(fn('EXTRACT', 'MONTH', col('birthdate')), today.month()),
        where(fn('EXTRACT', 'DAY', col('birthdate')), today.day()),
      ],
      id: {
        [Op.notIn]: sendedUserIds,
      },
    },
  });

  await Promise.all(
    todaysBirthdays.map(async (a) => {
      const content = await crearPDFFelicitacion(a);
      return CongratsModel.create({
        userId: a.id,
        status: 1,
        content,
        sentAt: new Date(),
      });
    }),
  );

  res.json({ message: 'PDF de felicitación creado exitosamente.' });
}
