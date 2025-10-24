import dayjs from 'dayjs';
import { type Request, type Response } from 'express';
import { Op, col, fn, where } from 'sequelize';
import Academic from '../models/academic.js';
import CongratsModel from '../models/congrats.js';

import { generarFelicitacion } from '../services/generateCongratsPDF.js';
import sendPdf from '../services/sendPdf.js';

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

  // const sendedUserIds = sendedCongrats.map((c) => c.userId);

  const todaysBirthdays = await Academic.findAll({
    where: {
      enabled: true,
      [Op.and]: [
        where(fn('DATE_PART', 'month', col('birthdate')), today.month() + 1),
        where(fn('DATE_PART', 'day', col('birthdate')), today.date()),
      ],
      // id: {
      //   [Op.notIn]: sendedUserIds,
      // },
    },
  });

  console.log(
    `Se encontraron ${todaysBirthdays.length} académicos con cumpleaños hoy.`,
  );

  await Promise.all(
    todaysBirthdays.map(async (a) => {
      return sendPdf(a, await generarFelicitacion(a));
    }),
  );

  console.log('Todos los PDFs de felicitación han sido procesados.');

  res.json({
    message: `${todaysBirthdays.length} PDFs de felicitación creado exitosamente.`,
  });
}
