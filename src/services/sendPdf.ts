import { Base64Encode } from 'base64-stream';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import type { AcademicModel } from '../models/academic.js';
import type { CongratsModel } from '../models/congrats.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'harvey.klocko@ethereal.email',
    pass: '8EnVVZnqTcqjTUfUme',
  },
});

export function crearPDFFelicitacion({ content }: CongratsModel): Base64Encode {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  const stream = doc.pipe(new Base64Encode());

  try {
    doc.image('images/logo.png', 50, 50, {
      fit: [150, 100],
    });
  } catch (error) {
    console.log('Logo no encontrado, continuando sin imagen...');
  }

  const fechaActual = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc
    .font('fonts/Lora-Regular.ttf')
    .fontSize(12)
    .fillColor('black')
    .text(fechaActual, 400, 80, { align: 'right' });
  doc
    .fontSize(10)
    .fillColor('black')
    .text(`Guadalajara, Jalisco`, { align: 'right' });

  doc
    .font('fonts/Lora-Regular.ttf')
    .fontSize(18)
    .fillColor('#8B4513')
    .text('UNIVERSIDAD DE GUADALAJARA', doc.page.width / 2 - 150, 180, {
      align: 'center',
      width: 300,
    });

  doc.fontSize(14).fillColor('#B8860B').text('FELICITACIÓN DE CUMPLEAÑOS', {
    align: 'center',
    width: 300,
  });

  doc
    .font('fonts/Lora-Regular.ttf')
    .fontSize(14)
    .fillColor('black')
    .text(content, 50, 260, {
      width: 500,
      align: 'justify',
      lineGap: 8,
    });

  doc.fontSize(12).text('Atentamente,', 50, doc.y + 30);

  doc.text('La Comunidad Universitaria', 50, doc.y + 10);
  doc.text('Universidad de Guadalajara', 50, doc.y + 5);

  doc
    .fontSize(10)
    .fillColor('#666666')
    .text('"Piensa y Trabaja" - Universidad de Guadalajara', 50, 770, {
      align: 'center',
      width: 500,
    });

  doc.end();
  return stream;
}

export default function (
  academic: AcademicModel,
  congrat: CongratsModel,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const pdfStream = crearPDFFelicitacion(congrat);

      let content: string = '';
      pdfStream.on('data', (chunk) => {
        content += chunk;
      });

      pdfStream.on('end', async () => {
        const fullname = `${academic.firstName} ${academic.lastName}`;
        await transporter.sendMail({
          from: `${fullname} <${academic.email}>`,
          to: 'damaris.blick@ethereal.email',
          subject: 'Feliz Cumpleaños',
          text: '¡Feliz cumpleaños! Aquí tienes tu felicitación en PDF.',
          attachments: [
            {
              filename: `felicitacion_${fullname.replaceAll(' ', '_')}.pdf`,
              content,
              encoding: 'base64',
              contentType: 'application/pdf',
            },
          ],
        });
        congrat.sentAt = new Date();
        congrat.status = 1;
        await congrat.save();
        console.log(`Correo enviado a ${academic.email}`);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
