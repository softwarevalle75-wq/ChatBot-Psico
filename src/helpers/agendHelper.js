import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Convierte rango horario de horas (8-12) a minutos desde medianoche
 */
function horaAMinutos(hora) {
  return hora * 60;
}

/**
 * Convierte minutos desde medianoche a hora legible
 */
function minutosAHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  const ampm = horas >= 12 ? 'PM' : 'AM';
  const hora12 = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
  return `${hora12}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Obtiene la próxima fecha disponible para un día de la semana
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
  
  if (diasHastaObjetivo <= 0) {
    diasHastaObjetivo += 7;
  }

  const proximaFecha = new Date(hoy);
  proximaFecha.setDate(hoy.getDate() + diasHastaObjetivo);
  proximaFecha.setHours(0, 0, 0, 0);

  return proximaFecha;
}

/**
 * Busca practicantes disponibles según día y rango horario
 */
export async function buscarPracticanteDisponible(dia, horaInicio, horaFin, fechaSolicitada) {
  try {
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
        const fechaCita = new Date(cita.fechaHora);
        const horaCitaEnMinutos = fechaCita.getHours() * 60 + fechaCita.getMinutes();
        
        const esMismoDia = fechaCita.toISOString().split('T')[0] === fechaSolicitada.toISOString().split('T')[0];
        
        const duracionCita = 60;
        const finCita = horaCitaEnMinutos + duracionCita;
        
        const haySolapamiento = esMismoDia && (
          (horaCitaEnMinutos < minFin && finCita > minInicio)
        );
        
        return haySolapamiento;
      });
      
      return !tieneCitaEnHorario;
    });

    return practicantesDisponibles;

  } catch (error) {
    console.error('❌ Error buscando practicante:', error);
    throw error;
  }
}

/**
 * Guarda una cita en la base de datos
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

    // 3. Calcular fecha y hora de la cita PRIMERO
    const fechaCita = obtenerProximaFecha(dia);
    fechaCita.setHours(horaInicio, 0, 0, 0);

    console.log('📅 Fecha calculada:', fechaCita);

    // 4. Buscar consultorio disponible (sin citas en ese horario)
    const consultorios = await prisma.consultorio.findMany({
      where: { activo: true },
      include: {
        citas: {
          where: {
            fechaHora: fechaCita,
            estado: {
              in: ['pendiente', 'confirmada']
            }
          }
        }
      }
    });

    console.log(`🔍 Total consultorios activos: ${consultorios.length}`);

    // Filtrar consultorios que NO tengan citas en ese horario
    const consultorioDisponible = consultorios.find(consultorio => {
      const tieneCita = consultorio.citas.length > 0;
      console.log(`   🏥 ${consultorio.nombre}: ${tieneCita ? '❌ Ocupado' : '✅ Disponible'}`);
      return !tieneCita;
    });

    if (!consultorioDisponible) {
      console.error('❌ Todos los consultorios están ocupados en este horario');
      throw new Error('No hay consultorios disponibles en este horario. Por favor selecciona otro día u horario.');
    }

    console.log(`✅ Consultorio asignado: ${consultorioDisponible.nombre}`);

    // 5. Crear la cita en la tabla principal
    const cita = await prisma.cita.create({
      data: {
        primerNombre: usuario.primerNombre,
				segundoNombre: usuario.segundoNombre || '',
				primerApellido: usuario.primerApellido,
				fechaHora: fechaCita,
				nombreConsultorio: consultorioDisponible.nombre,
				nombrePracticante: practicante.nombre,
        estado: 'pendiente'
        //---
        // idConsultorio: consultorioDisponible.idConsultorio,
        // idUsuario: usuario.idUsuario,
        // idPracticante: practicante.idPracticante,
        // fechaHora: fechaCita,
        // estado: 'pendiente'
      }
    });

    // 6. También crear en registroCitas para historial
    await prisma.registroCitas.create({
      data: {
        // primerNombre: usuario.primerNombre,
				// segundoNombre: usuario.segundoNombre,
				// primerApellido: usuario.primerApellido,
				// fechaHora: fechaCita,
				// nombreConsultorio: consultorioDisponible.nombre,
				// nombrePracticante: practicante.nombre,
        // estado: 'pendiente'
        //---
        idCita: cita.idCita,
        idConsultorio: consultorioDisponible.idConsultorio,
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
      consultorio: consultorioDisponible
    };

  } catch (error) {
    console.error('❌ Error guardando cita:', error);
    throw error;
  }
}

/**
 * Formatea información de la cita para mostrar al usuario
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