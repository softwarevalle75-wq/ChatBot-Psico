import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Convierte rango horario de horas (8-12) a minutos desde medianoche
 * @param {number} hora - Hora en formato 24h (8, 12, 17, etc)
 * @returns {number} Minutos desde medianoche
 * 
 * Ejemplo: horaAMinutos(8) = 480
 *          horaAMinutos(17) = 1020
 */
function horaAMinutos(hora) {
  return hora * 60;
}

/**
 * Convierte minutos desde medianoche a hora legible
 * @param {number} minutos - Minutos desde medianoche
 * @returns {string} Hora en formato "8:00 AM"
 * 
 * Ejemplo: minutosAHora(480) = "8:00 AM"
 *          minutosAHora(1020) = "5:00 PM"
 */
function minutosAHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  const ampm = horas >= 12 ? 'PM' : 'AM';
  const hora12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
  return `${hora12}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Busca practicantes disponibles según día y rango horario
 * @param {string} dia - Día de la semana (LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO)
 * @param {number} horaInicio - Hora inicio en formato 24h (8, 12, 17)
 * @param {number} horaFin - Hora fin en formato 24h (12, 17, 20)
 * @returns {Promise<Array>} Array de practicantes disponibles
 * 
 * Ejemplo:
 * await buscarPracticanteDisponible('LUNES', 8, 12)
 * // Retorna practicantes que trabajan LUNES de 8 AM a 12 PM
 */
export async function buscarPracticanteDisponible(dia, horaInicio, horaFin, fechaSolicitada) {
  try {
    // Convertir horas a minutos (8:00 = 480 minutos, 12:00 = 720 minutos)
    
    const minInicio = horaAMinutos(horaInicio);
    const minFin = horaAMinutos(horaFin);

    console.log('🔍 Buscando practicante...');
    console.log('📅 Día:', dia);
    console.log('🕐 Rango:', `${horaInicio}:00 - ${horaFin}:00 (${minInicio}-${minFin} minutos)`);

    // Buscar practicantes que tengan horarios compatibles
    const practicantes = await prisma.practicante.findMany({
      where: {
        horarios: {
          some: {
            dia: dia,
            // El horario del practicante debe cubrir el rango solicitado
            // Si el practicante trabaja de 780 a 1020 (13:00-17:00)
            // y el usuario pide 12:00-17:00 (720-1020)
            // entonces horaInicio (780) debe ser <= 720 Y horaFin (1020) >= 1020
            horaInicio: { lte: minInicio },
            horaFin: { gte: minFin }
          }
        }
      },
      include: {
        horarios: {
          where: {
            dia: dia
          }
        },
        citas: {
          where: {
            estado: {
              in: ['pendiente', 'confirmada']
            }
          }
        }
      }
    });

    console.log(`✅ Encontrados ${practicantes.length} practicantes con horarios compatibles`);

    // Filtrar practicantes que tengan disponibilidad (sin citas en conflicto)
    const practicantesDisponibles = practicantes.filter(practicante => {

      const tieneCitaEnHorario = practicante.citas.some(cita => {
      // Convertir la fecha de la cita a minutos desde medianoche
      const fechaCita = new Date(cita.fechaHora);
      const horaCitaEnMinutos = fechaCita.getHours() * 60 + fechaCita.getMinutes();
      
      // Verificar si la cita está en el mismo día solicitado
      const esMismoDia = fechaCita.toISOString().split('T')[0] === fechaSolicitada.toISOString().split('T')[0];
      
      // Verificar si hay solapamiento de horarios
      // Una cita típicamente dura 60 minutos (ajusta según tu necesidad)
      const duracionCita = 60; // minutos
      const finCita = horaCitaEnMinutos + duracionCita;
      
      // Hay conflicto si:
      // - Es el mismo día
      // - Y hay solapamiento: la cita comienza antes de que termine el horario solicitado
      //   Y la cita termina después de que comience el horario solicitado
      const haySolapamiento = esMismoDia && (
        (horaCitaEnMinutos < minFin && finCita > minInicio)
      );
      
      return haySolapamiento;
    });
    
    // El practicante está disponible si NO tiene citas en ese horario
    return !tieneCitaEnHorario;
  });

    return practicantesDisponibles;

  } catch (error) {
    console.error('❌ Error buscando practicante:', error);
    throw error;
  }
}

/**
 * Obtiene la próxima fecha disponible para un día de la semana
 * @param {string} diaNombre - Nombre del día (LUNES, MARTES, etc)
 * @returns {Date} Próxima fecha del día solicitado
 * 
 * Ejemplo: Si hoy es Lunes y pides VIERNES, retorna este viernes
 *          Si hoy es Sábado y pides VIERNES, retorna el próximo viernes
 */
function obtenerProximaFecha(diaNombre) {
  const mapaDias = {
    'LUNES': 1,
    'MARTES': 2,
    'MIERCOLES': 3,
    'JUEVES': 4,
    'VIERNES': 5,
    'SABADO': 6,
    'DOMINGO': 0
  };

  const diaObjetivo = mapaDias[diaNombre];
  const hoy = new Date();
  const diaActual = hoy.getDay();

  let diasHastaObjetivo = diaObjetivo - diaActual;
  
  // Si el día ya pasó esta semana, programar para la próxima semana
  if (diasHastaObjetivo <= 0) {
    diasHastaObjetivo += 7;
  }

  const proximaFecha = new Date(hoy);
  proximaFecha.setDate(hoy.getDate() + diasHastaObjetivo);
  proximaFecha.setHours(0, 0, 0, 0);

  return proximaFecha;
}

/**
 * Guarda una cita en la base de datos
 * @param {string} telefono - Teléfono del usuario (debe existir en BD)
 * @param {string} idPracticante - ID del practicante
 * @param {string} dia - Día de la semana (LUNES, MARTES, etc)
 * @param {number} horaInicio - Hora de inicio (8, 12, 17)
 * @param {number} horaFin - Hora de fin (12, 17, 20)
 * @returns {Promise<Object>} Objeto con datos de la cita creada
 * 
 * Ejemplo:
 * const cita = await guardarCita('573001234567', 'uuid-practicante', 'LUNES', 8, 12)
 */
export async function guardarCita(telefono, idPracticante, dia, horaInicio) {
  try {
    console.log('💾 Guardando cita...');
    console.log('📞 Teléfono:', telefono);
    console.log('👨‍⚕️ Practicante:', idPracticante);

    // 1. Obtener usuario por teléfono
    const usuario = await prisma.informacionUsuario.findUnique({
      where: { telefonoPersonal: telefono }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Obtener practicante con sus horarios
    const practicante = await prisma.practicante.findUnique({
      where: { idPracticante: idPracticante },
      include: {
        horarios: {
          where: { dia: dia }
        }
      }
    });

    if (!practicante) {
      throw new Error('Practicante no encontrado');
    }

    // 3. Obtener consultorio activo (tomamos el primero disponible)
    const consultorio = await prisma.consultorio.findFirst({
      where: { activo: true }
    });

    if (!consultorio) {
      throw new Error('No hay consultorios disponibles');
    }

    // 4. Calcular fecha y hora de la cita
    const fechaCita = obtenerProximaFecha(dia);
    fechaCita.setHours(horaInicio, 0, 0, 0);

    // 5. Crear la cita en la tabla principal
    const cita = await prisma.cita.create({
      data: {
        idConsultorio: consultorio.idConsultorio,
        idUsuario: usuario.idUsuario,
        idPracticante: practicante.idPracticante,
        fechaHora: fechaCita,
        estado: 'pendiente'
      }
    });

    // 6. También crear en registroCitas para historial
    await prisma.registroCitas.create({
      data: {
        idCita: cita.idCita,
        idConsultorio: consultorio.idConsultorio,
        idUsuario: usuario.idUsuario,
        idPracticante: practicante.idPracticante,
        fechaHora: fechaCita,
        estado: 'pendiente'
      }
    });

    console.log('✅ Cita guardada exitosamente');

    return {
      cita: cita,
      practicante: practicante,
      fecha: fechaCita,
      consultorio: consultorio
    };

  } catch (error) {
    console.error('❌ Error guardando cita:', error);
    throw error;
  }
}

/**
 * Formatea información de la cita para mostrar al usuario
 * @param {Object} citaData - Datos de la cita retornados por guardarCita()
 * @returns {string} Mensaje formateado para WhatsApp
 * 
 * Ejemplo de salida:
 * ✅ ¡CITA AGENDADA EXITOSAMENTE!
 * 
 * 👨‍⚕️ Psicólogo: Dr. Juan Pérez
 * 📅 Fecha y hora: Lunes, 7 de octubre de 2024 a las 08:00
 * 🏥 Consultorio: Consultorio Principal
 */
export function formatearMensajeCita(citaData) {
  const { practicante, fecha, consultorio } = citaData;
  
  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  };
  
  const fechaFormateada = fecha.toLocaleDateString('es-CO', opciones);

  return `✅ *¡CITA AGENDADA EXITOSAMENTE!*\n\n` +
         `👨‍⚕️ *Psicólogo:* ${practicante.nombre}\n` +
         `📅 *Fecha y hora:* ${fechaFormateada}\n` +
         `🏥 *Consultorio:* ${consultorio.nombre}\n\n` +
         `📝 *Estado:* Pendiente de confirmación\n\n` +
         `Te enviaremos un recordatorio antes de tu cita. ¡Nos vemos pronto! 🌟`;
}

/**
 * Obtiene horarios disponibles formateados para mostrar
 * @param {Array} practicantes - Array de practicantes con horarios
 * @returns {string} Mensaje con lista de practicantes
 * 
 * Ejemplo de salida:
 * ✅ Practicantes disponibles:
 * 
 * 1. Dr. Juan Pérez
 *    🕐 Horario: 8:00 AM - 12:00 PM
 *    📊 Sesiones: 15
 */
export function formatearHorariosDisponibles(practicantes) {
  if (!practicantes || practicantes.length === 0) {
    return '❌ No hay practicantes disponibles en este horario.';
  }

  let mensaje = '✅ *Practicantes disponibles:*\n\n';
  
  practicantes.forEach((pract, index) => {
    const horario = pract.horarios[0];
    const horaInicio = minutosAHora(horario.horaInicio);
    const horaFin = minutosAHora(horario.horaFin);
    
    mensaje += `${index + 1}. *${pract.nombre}*\n`;
    mensaje += `   🕐 Horario: ${horaInicio} - ${horaFin}\n`;
    mensaje += `   📊 Sesiones realizadas: ${pract.sesiones}\n\n`;
  });

  return mensaje;
}