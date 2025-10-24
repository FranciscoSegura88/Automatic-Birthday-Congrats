import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

// Interfaz para definir la estructura de un adjunto (el PDF)
interface Attachment {
  filename: string;
  content: string; // El contenido irá en base64
  encoding: 'base64';
  contentType: string; // 'application/pdf'
}

// Variable global para guardar el "transporter" de Ethereal una vez creado
let testTransporter: nodemailer.Transporter | null = null;

/**
 * Crea o reutiliza una cuenta de prueba en Ethereal para enviar correos.
 * @returns {Promise<nodemailer.Transporter>} El transporter configurado.
 */
async function getTestTransporter(): Promise<nodemailer.Transporter> {
  // Si ya lo creamos antes en esta ejecución, lo devolvemos
  if (testTransporter) {
    return testTransporter;
  }

  // Si no, creamos una nueva cuenta de prueba
  console.log('Creando cuenta de prueba en Ethereal...');
  const testAccount = await nodemailer.createTestAccount();
  console.log('Cuenta de prueba Ethereal creada:');
  console.log('Usuario:', testAccount.user);
  console.log('Contraseña:', testAccount.pass);
  console.log('Host SMTP:', testAccount.smtp.host);
  console.log('Puerto SMTP:', testAccount.smtp.port);
  console.log('Secure:', testAccount.smtp.secure);

  // Configuramos el 'transporter' con los datos de la cuenta de prueba
  testTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user, // Usuario generado por Ethereal
      pass: testAccount.pass, // Contraseña generada por Ethereal
    },
    // Descomentar si hay problemas con certificados TLS (a veces necesario)
    // tls: {
    //   rejectUnauthorized: false
    // }
  });

  return testTransporter;
}

/**
 * Envía un correo electrónico usando una cuenta de prueba de Ethereal.
 * Muestra la URL de vista previa en la consola.
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
  console.log(`Intentando enviar correo de PRUEBA (Ethereal) a: ${to}`);

  try {
    // Obtenemos el transporter (se creará la cuenta Ethereal la primera vez)
    const transporter = await getTestTransporter();

    // Configuramos los detalles del correo
    const mailOptions: Mail.Options = {
      from: `"Felicitaciones UdeG (Test)" <test@udg.mx>`, // Remitente (puede ser ficticio para Ethereal)
      to: to, // Destinatario (Ethereal lo interceptará)
      subject: subject, // Asunto
      text: textBody, // Cuerpo en texto
      html: htmlBody, // Cuerpo en HTML
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
    }

    // Enviamos el correo
    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo de prueba enviado: ${info.messageId}`);

    // ¡¡LA PARTE MÁS IMPORTANTE!! Obtenemos y mostramos la URL de Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`------------------------------------------------------------------`);
      console.log(`---> Vista previa del correo disponible en: ${previewUrl} <---`);
      console.log(`------------------------------------------------------------------`);
      console.log(`(Abre esta URL en tu navegador para ver el correo)`);
    } else {
      console.warn('No se pudo obtener la URL de vista previa de Ethereal.');
    }

  } catch (error) {
    console.error(`Error al intentar enviar correo de prueba a ${to}:`, error);
    // Relanzamos el error para que el controlador sepa que algo falló
    throw error;
  }
}

