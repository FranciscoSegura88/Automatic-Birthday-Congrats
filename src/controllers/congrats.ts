import dayjs from 'dayjs';
import { type Request, type Response } from 'express';
import { Op, col, fn, where } from 'sequelize';
import Academic from '../models/academic.js';
import CongratsModel from '../models/congrats.js';
import { crearPDFFelicitacion } from '../services/generateCongratsPDF.js';
// ---- Importamos la función para enviar correos ----
import { sendEmail } from '../services/emailService.js'; // Asegúrate que la ruta sea correcta

/**
 * Controlador para buscar cumpleañeros del día, generar PDF de felicitación,
 * y enviar un correo de prueba usando Ethereal.
 */
export async function createCongratsPDF(
  req: Request,
  res: Response,
): Promise<void> {
  const today = dayjs(); // Fecha y hora actuales
  const currentYear = today.year(); // Año actual para el nombre del archivo

  console.log('--- Iniciando proceso de felicitaciones ---');
  console.log('Fecha de hoy:', today.format('YYYY-MM-DD'));

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

    if (processedUserIds.length > 0) {
      console.log('IDs de académicos ya felicitados exitosamente hoy:', processedUserIds.join(', '));
    } else {
      console.log('Ningún académico felicitado previamente hoy.');
    }

    // 2. Buscar académicos ACTIVOS que cumplen años HOY (mes y día) y no procesados hoy
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

    console.log(`Encontrados ${todaysBirthdays.length} cumpleaños para procesar hoy.`);

    if (todaysBirthdays.length === 0) {
      res.json({ message: 'No hay cumpleaños nuevos para procesar hoy.' });
      console.log('--- Proceso de felicitaciones finalizado (sin nuevos cumpleaños) ---');
      return;
    }

    // 3. Procesar CADA cumpleañero
    let successCount = 0;
    let failureCount = 0;

    for (const academic of todaysBirthdays) {
      const academicInfo = `${academic.degree} ${academic.firstName} ${academic.lastName} (ID: ${academic.id}, Email: ${academic.email})`;
      console.log(`\nProcesando: ${academicInfo}`);

      let pdfBase64Content: string | null = null;
      let sentAtDate: Date | null = null;
      let finalStatus: number = 0; // 0=pendiente, 1=éxito, 2=error

      try {
        // 3a. Generar PDF
        console.log(`Generando PDF para ${academic.firstName}...`);
        pdfBase64Content = await crearPDFFelicitacion(academic);
        const fileName = `felicitacion_${academic.firstName}_${academic.lastName}_${currentYear}.pdf`;
        console.log(`PDF generado (${fileName}).`);

        if (!pdfBase64Content) {
          throw new Error('El contenido del PDF generado está vacío.');
        }

        // 3b. Preparar correo
        const subject = `¡Feliz Cumpleaños ${academic.degree} ${academic.lastName}!`;
        const textBody = `Estimado(a) ${academic.degree} ${academic.lastName},\n\nLa comunidad de la Universidad de Guadalajara le desea un muy feliz cumpleaños.\n\nAdjunto encontrará una pequeña felicitación.\n\nAtentamente,\nUniversidad de Guadalajara`;
        const htmlBody = `<p>Estimado(a) ${academic.degree} ${academic.lastName},</p><p>La comunidad de la Universidad de Guadalajara le desea un muy <strong>feliz cumpleaños</strong>.</p><p>Adjunto encontrará una pequeña felicitación.</p><p>Atentamente,<br/>Universidad de Guadalajara</p>`;

        // 3c. Enviar correo (Ethereal)
        console.log(`Intentando enviar correo de prueba a ${academic.email}...`);
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
        console.log(`Correo de prueba para ${academic.firstName} procesado.`);

      } catch (error: any) {
        console.error(`Error procesando a ${academicInfo}:`, error.message || error);
        finalStatus = 2; // Error
        sentAtDate = null;
        failureCount++;
      }

      // 3d. Guardar/Actualizar registro en BD
      try {
        // ---- CORRECCIÓN AQUÍ ----
        // Creamos un objeto base para los datos del upsert
        const upsertData: {
          userId: number;
          status: number;
          content: string;
          sentAt?: Date; // Hacemos sentAt opcional en este objeto temporal
        } = {
          userId: academic.id,
          status: finalStatus,
          content: pdfBase64Content || 'Error al generar PDF',
        };

        // Solo añadimos sentAt al objeto si NO es null
        if (sentAtDate !== null) {
          upsertData.sentAt = sentAtDate;
        }

        // Pasamos el objeto construido a upsert
        await CongratsModel.upsert(upsertData);
        // ------------------------

        console.log(`Registro en BD guardado/actualizado para ID ${academic.id} con estado ${finalStatus}.`);
      } catch (dbError: any) {
        console.error(`Error CRÍTICO al guardar/actualizar registro en BD para ID ${academic.id}:`, dbError.message || dbError);
        if (finalStatus === 1) {
          successCount--;
          failureCount++;
        }
      }
    } // Fin del bucle

    // 4. Respuesta final
    const summary = `Proceso completado. Éxitos: ${successCount}, Fallos: ${failureCount}.`;
    console.log(`\n--- Proceso de felicitaciones finalizado ---`);
    console.log(summary);
    res.json({
      message: `${summary} Revisa la consola del servidor para las URLs de Ethereal.`,
    });

  } catch (generalError: any) {
    console.error('Error general grave durante el proceso de felicitaciones:', generalError.message || generalError);
    res.status(500).json({ message: 'Error interno del servidor al procesar felicitaciones.' });
  }
}

