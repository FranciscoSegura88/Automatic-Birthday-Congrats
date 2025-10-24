import { Base64Encode } from 'base64-stream';
import type PDFDocumentType from 'pdfkit';
import type { AcademicModel } from '../models/academic.js';

function generarTextoFelicitacion({
  firstName,
  lastName,
  degree,
  department,
}: AcademicModel): string {
  const name = `${firstName} ${lastName}`;
  const mensajesPrincipales = [
    `En nombre de toda la comunidad de la Universidad de Guadalajara, nos complace extender nuestras más cordiales felicitaciones al ${degree} ${name} en este día tan especial.`,
    `La Universidad de Guadalajara se une a la celebración del cumpleaños del estimado ${degree} ${name}, reconociendo su invaluable contribución a nuestra institución.`,
    `Con gran alegría, la Universidad de Guadalajara felicita al distinguido ${degree} ${name} en el día de su cumpleaños.`,
    `Es un honor para la Universidad de Guadalajara celebrar junto al ${degree} ${name} este día tan significativo.`,
  ];

  const reconocimientos = [
    'Su dedicación y compromiso con la excelencia académica son una inspiración para toda nuestra comunidad universitaria.',
    'Su labor como educador y su contribución al desarrollo del conocimiento han dejado una huella imborrable en generaciones de estudiantes.',
    'Su trayectoria profesional y académica son un ejemplo de excelencia que enorgullece a nuestra casa de estudios.',
    'Su pasión por la enseñanza y la investigación continúa enriqueciendo el prestigio de nuestra universidad.',
  ];

  const deseos = [
    'Que este nuevo año de vida esté lleno de salud, prosperidad y nuevos logros académicos.',
    'Deseamos que continúe cosechando éxitos en su carrera profesional y que la vida le brinde muchas satisfacciones.',
    'Que este cumpleaños marque el inicio de un año repleto de bendiciones, nuevos proyectos y realizaciones personales.',
    'Esperamos que este día especial esté rodeado de la alegría de sus seres queridos y el reconocimiento de sus colegas.',
  ];

  const cierres = [
    '¡Feliz cumpleaños y que tenga un día extraordinario!',
    'Con nuestros mejores deseos en este día tan especial.',
    '¡Muchas felicidades en su cumpleaños!',
    'Celebramos junto a usted este día de alegría y gratitud.',
  ];

  const mensajePrincipal =
    mensajesPrincipales[Math.floor(Math.random() * mensajesPrincipales.length)];
  const reconocimiento =
    reconocimientos[Math.floor(Math.random() * reconocimientos.length)];
  const deseo = deseos[Math.floor(Math.random() * deseos.length)];
  const cierre = cierres[Math.floor(Math.random() * cierres.length)];

  let textoCompleto = mensajePrincipal + '\n\n' + reconocimiento;

  if (department) {
    textoCompleto += `\n\nComo miembro distinguido del ${department}, su trabajo ha sido fundamental para el crecimiento y la excelencia de nuestra institución.`;
  }

  textoCompleto += '\n\n' + deseo + '\n\n' + cierre;

  return textoCompleto;
}

export async function crearPDFFelicitacion(
  academic: AcademicModel,
): Promise<string> {
  const { firstName, lastName, degree: titulo, department } = academic;
  const name = `${firstName} ${lastName}`;

  const pdfkitModule = await import('pdfkit');
  const PDFDocument = (pdfkitModule as any).default as typeof PDFDocumentType;

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

  const textoFelicitacion = generarTextoFelicitacion(academic);

  doc
    .font('fonts/Lora-Regular.ttf')
    .fontSize(14)
    .fillColor('black')
    .text(textoFelicitacion, 50, 260, {
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

  return new Promise<string>((res, rej) => {
    try {
      var data = '';
      stream.on('data', (chunk) => {
        data += chunk;
      });

      stream.on('end', () => {
        res(data);
      });
    } catch (error) {
      rej(error);
    }
  });
}
