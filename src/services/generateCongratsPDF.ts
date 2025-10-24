import type { AcademicModel } from '../models/academic.js';
import CongratsModel, {
  type CongratsModel as Congrat,
} from '../models/congrats.js';

export function generarFelicitacion({
  id,
  firstName,
  lastName,
  degree,
  department,
}: AcademicModel): Promise<Congrat> {
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

  return CongratsModel.create({
    userId: id,
    content: textoCompleto,
  });
}
