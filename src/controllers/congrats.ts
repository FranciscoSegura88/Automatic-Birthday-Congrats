// FILE: src/controllers/congrats.ts (CORREGIDO)

import dayjs from 'dayjs';
import { type Request, type Response } from 'express';
import { Op, col, fn, where } from 'sequelize';
import Academic from '../models/academic.js';
import CongratsModel from '../models/congrats.js';
import { crearPDFFelicitacion } from '../services/generateCongratsPDF.js';
import { sendEmail } from '../services/emailService.js';

// ----------------------------------------------------------------------
// --- 1. LÓGICA CENTRAL DEL WORKER (Función Independiente y Exportada) ---
// ----------------------------------------------------------------------

/**
 * Función que contiene toda la lógica para buscar cumpleañeros, generar PDF,
 * enviar correo y actualizar la base de datos.
 * Esta función no depende de los objetos Request o Response de Express.
 */
export async function runBirthdayCongratsJob(): Promise<{
  successCount: number;
  failureCount: number;
  message: string;
}> {
  const today = dayjs();
  const currentYear = today.year();

  console.log('--- Iniciando proceso de felicitaciones (Worker Mode) ---');

  try {
    // 1. Buscar IDs de académicos ya procesados con ÉXITO hoy
    const processedSuccessfullyToday = await CongratsModel.findAll({
      where: {
        sentAt: {
          [Op.gte]: today.startOf('day').toDate(),
          [Op.lte]: today.endOf('day').toDate(),
        },
        status: 1,
      },
      attributes: ['userId'],
    });
    const processedUserIds = processedSuccessfullyToday.map((c) => c.userId);

    // 2. Buscar académicos ACTIVOS que cumplen años HOY
    const todaysBirthdays = await Academic.findAll({
      where: {
        enabled: true,
        [Op.and]: [
          where(fn('EXTRACT', 'MONTH', col('birthdate')), today.month() + 1),
          where(fn('EXTRACT', 'DAY', col('birthdate')), today.date()),
        ],
        id: {
          [Op.notIn]: processedUserIds,
        },
      },
    });

    console.log(
      `Encontrados ${todaysBirthdays.length} cumpleaños para procesar hoy.`,
    );

    if (todaysBirthdays.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No hay cumpleaños nuevos para procesar hoy.',
      };
    }

    // 3. Procesar CADA cumpleañero (Bucle for of: se mantiene igual)
    let successCount = 0;
    let failureCount = 0;

    for (const academic of todaysBirthdays) {
      const academicInfo = `${academic.degree} ${academic.firstName} ${academic.lastName} (ID: ${academic.id}, Email: ${academic.email})`;
      console.log(`\nProcesando: ${academicInfo}`);

      let pdfBase64Content: string | null = null;
      let sentAtDate: Date | null = null;
      let finalStatus: number = 0;

      try {
        // 3a. Generar PDF (misma lógica)
        pdfBase64Content = await crearPDFFelicitacion(academic);
        const fileName = `felicitacion_${academic.firstName}_${academic.lastName}_${currentYear}.pdf`;
        // ... (mucha más lógica de generación y envío de correo) ...

        // 3c. Enviar correo (misma lógica)
        const subject = `¡Feliz Cumpleaños ${academic.degree} ${academic.lastName}!`;
        const textBody = `Estimado(a) ${academic.degree} ${academic.lastName},\n\nLa comunidad de la Universidad de Guadalajara le desea un muy feliz cumpleaños.\n\nAdjunto encontrará una pequeña felicitación.\n\nAtentamente,\nUniversidad de Guadalajara`;
        const htmlBody = `<p>Estimado(a) ${academic.degree} ${academic.lastName},</p><p>La comunidad de la Universidad de Guadalajara le desea un muy <strong>feliz cumpleaños</strong>.</p><p>Adjunto encontrará una pequeña felicitación.</p><p>Atentamente,<br/>Universidad de Guadalajara</p>`;

        await sendEmail(academic.email, subject, textBody, htmlBody, {
          filename: fileName,
          content: pdfBase64Content,
          encoding: 'base64',
          contentType: 'application/pdf',
        });

        // Éxito si no hubo error
        finalStatus = 1;
        sentAtDate = new Date();
        successCount++;
        console.log(`Correo para ${academic.firstName} procesado con éxito.`);
      } catch (error: any) {
        console.error(
          `Error procesando a ${academicInfo}:`,
          error.message || error,
        );
        finalStatus = 2; // Error
        sentAtDate = null;
        failureCount++;
      }

      // 3d. Guardar/Actualizar registro en BD (misma lógica)
      try {
        const upsertData: {
          userId: number;
          status: number;
          content: string;
          sentAt?: Date;
        } = {
          userId: academic.id,
          status: finalStatus,
          content: pdfBase64Content || 'Error al generar PDF',
        };

        if (sentAtDate !== null) {
          upsertData.sentAt = sentAtDate;
        }

        await CongratsModel.upsert(upsertData);
        console.log(
          `Registro en BD guardado/actualizado para ID ${academic.id} con estado ${finalStatus}.`,
        );
      } catch (dbError: any) {
        console.error(
          `Error CRÍTICO al guardar/actualizar registro en BD para ID ${academic.id}:`,
          dbError.message || dbError,
        );
        if (finalStatus === 1) {
          successCount--;
          failureCount++;
        }
      }
    } // Fin del bucle

    // 4. Retorno final (para el worker)
    const summary = `Proceso completado. Éxitos: ${successCount}, Fallos: ${failureCount}.`;
    console.log(`\n--- Proceso de felicitaciones finalizado ---`);
    return { successCount, failureCount, message: summary };
  } catch (generalError: any) {
    console.error(
      'Error general grave durante el proceso de felicitaciones:',
      generalError.message || generalError,
    );
    throw generalError; // Lanzar el error para que el worker lo maneje
  }
}

// ----------------------------------------------------------------------
// --- 2. CONTROLADOR HTTP (Función Original de tu archivo) ---
// ----------------------------------------------------------------------

/**
 * Controlador para la ruta POST que ejecuta el proceso y devuelve la respuesta HTTP.
 */
export async function createCongratsPDF(
  req: Request,
  res: Response,
): Promise<void> {
  console.log('--- Solicitud HTTP recibida para iniciar el proceso ---');
  try {
    // Llama a la lógica central del worker
    const result = await runBirthdayCongratsJob();
    res.json(result); // Devuelve la respuesta HTTP
  } catch (error: any) {
    console.error('Error en el endpoint de la API:', error);
    res
      .status(500)
      .json({
        message: 'Error interno del servidor al procesar felicitaciones.',
      });
  }
}
