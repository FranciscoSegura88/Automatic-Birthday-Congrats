import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import dotenv from 'dotenv';

dotenv.config();

// Interfaz para definir la estructura de un adjunto (el PDF)
interface Attachment {
  filename: string;
  content: string; // El contenido irá en base64
  encoding: 'base64';
  contentType: string; // 'application/pdf'
}

//----------------------------------------------------------
//--------Configuracion del Transporter de Gmail.----------
//---------------------------------------------------------
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error(
    'FATAL: Las varaibles GMAIL_USER y GMAIL_APP_PASSWORD deben estar configuradas en .env para enviar correos',
  );
}

//Configuramos el 'transporter' usando el servicio de Gmail

// Configuramos el 'transporter' con los datos de la cuenta de prueba
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER, // Usuario de gmail
    pass: GMAIL_APP_PASSWORD, // Contraseña de app de Gmail
  },
  // Descomentar si hay problemas con certificados TLS (a veces necesario)
  // tls: {
  //   rejectUnauthorized: false
  // }
});

//----------------------------------------------------------------
//---------Funcion Principal de Envio de Correo-------------------
//----------------------------------------------------------------

/**
 * Envía un correo electrónico usando una cuenta de Gmail.
 * @param {string} to - Dirección del destinatario (informativo para Ethereal).
 * @param {string} subject - Asunto del correo.
 * @param {string} textBody - Cuerpo del correo en texto plano.
 * @param {string} htmlBody - Cuerpo del correo en formato HTML.
 * @param {Attachment} [attachment] - Archivo adjunto opcional (nuestro PDF).
 */
export async function sendEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string,
  attachment?: Attachment,
): Promise<void> {
  console.log(`Intentando enviar correo de REAL (GMAIL) a: ${to}`);

  try {
    // Obtenemos el transporter (se creará la cuenta Ethereal la primera vez)
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error('Credenciales de Gmail no configuradas.');
    }

    // Configuramos los detalles del correo
    const mailOptions: Mail.Options = {
      from: `"${GMAIL_USER}" <${GMAIL_USER}>`, // Va a ser nuestro propio correo
      to: to,
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    // Añadimos el adjunto si existe
    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content, // Contenido en base64
          encoding: attachment.encoding,
          contentType: attachment.contentType,
        },
      ];
      console.log(`Adjuntando archivo: ${attachment.filename}`);
    } else {
      delete mailOptions.attachments;
    }

    // Enviamos el correo
    const info = await gmailTransporter.sendMail(mailOptions);
    console.log(`Correo de prueba enviado: ${info.messageId}`);
  } catch (error) {
    console.error(`Error al intentar enviar correo de prueba a ${to}:`, error);
    // Relanzamos el error para que el controlador sepa que algo falló
    throw error;
  }
}
