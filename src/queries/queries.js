import Prisma from '@prisma/client'
export const prisma = new Prisma.PrismaClient()
import { adapterProvider } from '../app.js'
//---------------------------------------------------------------------------------------------------------

export const registrarUsuario = async (
  nombre,
  apellido,
  correo,
  tipoDocumento,
  documento,
  numero
) => {
  try {
    const user = await prisma.informacionUsuario.upsert({
      where: {
        telefonoPersonal: numero,
      },
      update: {
        nombre,
        apellido,
        correo,
        tipoDocumento,
        documento,
      },
      create: {
        telefonoPersonal: numero,
        nombre,
        apellido,
        correo,
        tipoDocumento,
        documento,
      },
    });
    return user;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    throw new Error("Hubo un problema al crear el usuario.");
  }
};
//---------------------------------------------------------------------------------------------------------

export const obtenerPracticantePorTelefono = async (numero) => {
  try {
    return await prisma.practicante.findFirst({
      where: { telefono: numero },
    });
  } catch (e) {
    console.error('obtenerPracticantePorTelefono error:', e);
    return null;
  }
};

// --- NUEVO: NO crea usuario; solo mira si existe por telefonoPersonal
export const buscarUsuarioPorTelefono = async (numero) => {
  try {
    return await prisma.informacionUsuario.findUnique({
      where: { telefonoPersonal: numero },
    });
  } catch (e) {
    console.error('buscarUsuarioPorTelefono error:', e);
    return null;
  }
};

// --- NUEVO: resuelve remitente por teléfono (prioriza practicante)
// export const resolverRemitentePorTelefono = async (numero) => {
//   const practicante = await obtenerPracticantePorTelefono(numero);
//   if (practicante) return { tipo: 'practicante', data: practicante };

//   const usuario = await buscarUsuarioPorTelefono(numero);
//   if (usuario) return { tipo: 'usuario', data: usuario };

//   return { tipo: 'desconocido', data: null };
// };



//---------------------------------------------------------------------------------------------------------

export const obtenerUsuario = async (numero) => {
	try {

		const getUser = async (numero) => {
			let user = await prisma.informacionUsuario.findUnique({
				where: {
					telefonoPersonal: numero,
				}
			})

			if(user){
				return { tipo: 'usuario', data: user}
			}

			const pract = await prisma.practicante.findUnique({
				where: {
					telefono: numero
				}
			})

			if(pract)
				return { tipo: 'practicante', data: pract};
			
			return null;
		}

		let user = await getUser(numero);

		// Si el usuario no existe, crearlo con un historial inicial
		if (!user) {
			user = await prisma.informacionUsuario.create({
				data: {
					telefonoPersonal: numero,
					historial: [],
				},
				select: {
					historial: true,
				},
			})
			return ''
		}
		return user
	} catch (error) {
		console.error('Error al obtener el usuario:', error)
		throw new Error('Hubo un problema al obtener el usuario.')
	}
}
//---------------------------------------------------------------------------------------------------------

// Normaliza el número (solo dígitos)
const normalizePhone = (raw) => (raw || '').replace(/\D/g, '');

export async function setRolTelefono(telefono, rol) {
	const phone = normalizePhone(telefono);
  return prisma.rolChat.upsert({
	where: { telefono: phone },
    update: { rol },
    create: { telefono: phone, rol },
  });
}
//---------------------------------------------------------------------------------------------------------

export async function getRolTelefono(telefono) {
	const phone = normalizePhone(telefono);
	return prisma.rolChat.findUnique({ where: { telefono: phone } });
}
//---------------------------------------------------------------------------------------------------------


export async function createUsuarioBasico(telefono, data = {}) {
  const phone = normalizePhone(telefono);
  // Crea (o asegura) un usuario mínimo en informacionUsuario
  const user = await prisma.informacionUsuario.upsert({
    where: { telefonoPersonal: phone },
    update: {
      nombre: data.nombre ?? undefined,
      apellido: data.apellido ?? undefined,
      correo: data.correo ?? undefined,
    },
    create: {
      telefonoPersonal: phone,
      nombre: data.nombre ?? null,
      apellido: data.apellido ?? null,
      correo: data.correo ?? null,
      historial: [],
      // los demás campos de tu modelo ya tienen defaults
    },
  });
  // Marca el rol en el mapa
  await setRolTelefono(phone, 'usuario');
  return user;
}

/**
 * Crea un “cascarón” para rol practicante/admin:
 * - Para 'practicante' NO creamos registro en la tabla practicante aquí porque tu modelo exige muchos campos obligatorios.
 *   Sugerencia: crea el perfil completo en su flujo propio.
 * - Para 'admin' normalmente basta con el mapeo (o si tienes tabla admin, haz upsert ahí).
 */
export async function ensureRolMapping(telefono, rol) {
  const phone = normalizePhone(telefono);
  await setRolTelefono(phone, rol);
  return { telefono: phone, rol };
}

export async function resolverRemitentePorTelefono(rawPhone) {
  const telefono = normalizePhone(rawPhone);

  // 1) Si existe mapeo, úsalo
  const mapping = await getRolTelefono(telefono);
  if (mapping) {
    return { tipo: mapping.rol, data: null };
  }

  // 2) Fallback a tus tablas (ajusta los campos según tu schema real)
  const user = await prisma.informacionUsuario.findUnique({
    where: { telefonoPersonal: telefono },
  });
  if (user) return { tipo: 'usuario', data: user };

  // Si tu modelo practicante tiene campo 'telefono', úsalo; si no, quita esto.
  try {
    const pract = await prisma.practicante.findUnique({
      where: { telefono: telefono },
    });
    if (pract) return { tipo: 'practicante', data: pract };
  } catch (_) {
    // si no existe la columna 'telefono' en practicante, ignora
  }

  // 3) Desconocido
  return null;
}

//---------------------------------------------------------------------------------------------------------

export const obtenerHist = async (numero) => {
	try {
		console.log('Obteniendo historial del usuario:', numero)
		const user = await prisma.informacionUsuario.findUnique({
			where: {
				telefonoPersonal: numero,
			},
			select: {
				historial: true,
			},
		})

		// Verificar si no se encontró el usuario
		if (!user) {
			console.error(`Usuario no encontrado con el número: ${numero}`)
			return []
		}

		// Retornar el historial del usuario encontrado
		return user.historial || []
	} catch (error) {
		console.error('Error al obtener o crear el historial del usuario:', error)
		throw new Error('Hubo un problema al procesar la solicitud de historial.')
	}
}

//---------------------------------------------------------------------------------------------------------

export async function saveHist(numero, conversationHistory) {
  try {
    console.log("Guardando historial para:", numero);

    await prisma.informacionUsuario.upsert({
      where: { telefonoPersonal: numero },
      update: { historial: conversationHistory },
      create: {
        telefonoPersonal: numero,
        historial: conversationHistory
      }
    });

    console.log("Historial guardado correctamente.");
  } catch (error) {
    console.error("Error al guardar el historial:", error);
    throw new Error("Hubo un problema al guardar el historial.");
  }
}

//---------------------------------------------------------------------------------------------------------

export const switchAyudaPsicologica = async (numero, opcion) => {
	try {
		await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				ayudaPsicologica: opcion,
			},
		})
	} catch (error) {
		console.error('Error al guardar el historial:', error)
		throw new Error('Hubo un problema al guardar el historial.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const switchFlujo = async (numero, flujo) => {
	try {
		await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				flujo: flujo,
			},
		})
	} catch (error) {
		console.error('Error al switchear el flujo:', error)
		throw new Error('Hubo un problema al switchear el flujo')
	}
}

//---------------------------------------------------------------------------------------------------------

export const sendAutonomousMessage = async (numero, mensaje) => {
	try {
		// Asegurate de que el número esté limpio
		const numeroLimpio = numero.replace(/\D/g, '');
		const numeroCompleto = `${numeroLimpio}@s.whatsapp.net`;
		
		await adapterProvider.sendText(numeroCompleto, mensaje);
		
		console.log(`Mensaje autónomo enviado a ${numero}: ${mensaje}`);
		return true;
	} catch (error) {
		console.error('Error enviando mensaje autónomo:', error);
		throw new Error('Hubo un problema enviando el mensaje autónomo.');
	}
}

//---------------------------------------------------------------------------------------------------------

export const getEstadoCuestionario = async(telefono, tipoTest) => {
	try {
		const modelo = seleccionarModelo(tipoTest)

		// Si el registro existe
		let infoCues = await modelo.findUnique ({
			where: { telefono }
		})
		
		// Si no hay registro, se crea
		if (!infoCues) {
			const defaultData = { telefono: telefono }

			if (tipoTest === 'ghq12') {
				defaultData.Puntaje = 0
				defaultData.preguntaActual = 0
				defaultData.resPreg = {}
			} else if (tipoTest === 'dass21') {
				defaultData.puntajeDep = 0
				defaultData.puntajeAns = 0
				defaultData.puntajeEstr = 0
				defaultData.preguntaActual = 0
				defaultData.resPreg = {}
				defaultData.respuestas= []
			} else {
				defaultData.Puntaje = 0
				defaultData.preguntaActual = 0
				defaultData.resPreg = {}
			}

			infoCues = await modelo.create ({
				data: defaultData,
			})
		}

		return infoCues

	} catch (error) {
		console.error('Error obteniendo el estado:', error)
		throw new Error('Hubo un problema obteniendo el estado.')
	}
}
//---------------------------------------------------------------------------------------------------------

export const saveEstadoCuestionario = async (
	telefono, 
	preguntaActual,
	resPreg,
	tipoTest,
	...extraParams // guardar paramentros adicionales
) => {
	const modelo = seleccionarModelo(tipoTest)

	const data = {
		preguntaActual: preguntaActual,
		resPreg: resPreg,
	}

	if (tipoTest === 'ghq12') {
		const [puntaje] = extraParams
		if (puntaje !== undefined) {
			data.Puntaje = puntaje
		}
	} else if (tipoTest === 'dass21') {
		const [respuestas] = extraParams
		if (respuestas !== undefined) {
			data.respuestas = respuestas
		}
	} else {
		const [puntaje] = extraParams
		if (puntaje !== undefined) {
			data.Puntaje = puntaje
		}
	}

	return await modelo.update({
		where: { telefono },
		data: data,
	})
}
//---------------------------------------------------------------------------------------------------------

export const savePuntajeUsuario = async (telefono, tipoTest, ...puntajeParams) => {
	const modelo = seleccionarModelo(tipoTest)

	console.log(`Tipo de test: ${tipoTest}`)
	
	if (tipoTest === 'ghq12') {
		const [puntaje, jsonPreg] = puntajeParams
		return await modelo.update ({
			where: { telefono },
			data: {
				Puntaje: puntaje,
				resPreg: jsonPreg,
			},
		})
	} else if (tipoTest === 'dass21') {
		const [puntajeDep, puntajeAns, puntajeEstr, jsonPreg] = puntajeParams
		
		return await modelo.update ({
			where: { telefono },
			data: {
				puntajeDep,
				puntajeAns,
				puntajeEstr,
				resPreg: jsonPreg,
			},
		})
	} else {
		const [puntaje, jsonPreg] = puntajeParams
		return await modelo.update ({
			where: { telefono },
			data: {
				Puntaje: puntaje,
				resPreg: jsonPreg,
			},
		})
	}
}


//---------------------------------------------------------------------------------------------------------


// Obtener el puntaje y pregunta actual.
export const getInfoCuestionario = async (telefono, tipoTest) => {
	try {
		const test = seleccionarModelo(tipoTest)

		if (tipoTest === 'dass21') {
			const infoCues = await test.findUnique ({
				where: { telefono },
				select: {
					puntajeDep: true,
					puntajeAns: true,
					puntajeEstr: true,
					preguntaActual: true,
					resPreg: true,
					respuestas: true,
				},
			})
			return { infoCues }
		} else if (tipoTest === 'ghq12') {
			const infoCues = await test.findUnique({
				where: { telefono },
				select: {
					Puntaje: true,
					preguntaActual: true,
					resPreg: true,
				},
			})

			if (infoCues) {
			const preguntas = [
				'1. ¿Ha podido concentrarse bien en lo que hace?\n    0) Mejor que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
				'2. ¿Sus preocupaciones le han hecho perder mucho el sueño?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
				'3. ¿Ha sentido que está desempeñando un papel útil en la vida?\n    0) Más que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
				'4. ¿Se ha sentido capaz de tomar decisiones?\n    0) Más capaz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos capaz que lo habitual.\n    3) Mucho menos capaz que lo habitual.',
				'5. ¿Se ha sentido constantemente agobiado y en tensión?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
				'6. ¿Ha sentido que no puede superar sus dificultades?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
				'7. ¿Ha sido capaz de disfrutar de sus actividades normales de cada día?\n    0) Más que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
				'8. ¿Ha sido capaz de hacer frente adecuadamente a sus problemas?\n    0) Más capaz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos capaz que lo habitual.\n    3) Mucho menos capaz que lo habitual.',
				'9. ¿Se ha sentido poco feliz o deprimido/a?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
				'10. ¿Ha perdido confianza en sí mismo/a?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
				'11. ¿Ha pensado que usted es una persona que no vale para nada?\n    0) No, en absoluto.\n    1) No más que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
				'12. ¿Se siente razonablemente feliz considerando todas las circunstancias?\n    0) Más feliz que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos feliz que lo habitual.\n    3) Mucho menos feliz que lo habitual.',
			]
			const preguntasString = preguntas.join('\n')
			const objetct = { infoCues, preguntasString }
			return objetct
		} else {
			await test.create({
				data: {
					telefono: telefono,
				},
			})
			return
		}
		}

		
	} catch (error) {
		console.error('Error obteniendo el estado:', error)
		throw new Error('Hubo un problema obteniendo el estado.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const changeTest = async (numero, tipoTest) => {
	try {
		const change = await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				testActual: tipoTest,
			},
		})
		return change.testActual
	} catch (error) {
		console.error('Error cambiando el test:', error)
		throw new Error('Hubo un problema cambiando el test.')
	}
}

//---------------------------------------------------------------------------------------------------------

// Función para seleccionar el modelo adecuado basado en el tipo de test
function seleccionarModelo(tipoTest) {
	if (tipoTest === 'ghq12') {
		return prisma.ghq12
	} else if (tipoTest === 'dass21') {
		return prisma.dass21
	} else {
		return prisma.tests
	}
}

//---------------------------------------------------------------------------------------------------------















//---------------------------------------------------------------------------------------------------------

export const actualizarDisp = async (numero, disp) => {
	try {
		const change = await prisma.informacionUsuario.update({
			where: {
				telefonoPersonal: numero,
			},
			data: {
				disponibilidad: disp,
			},
		})
		return change
	} catch (error) {
		console.error('Error cambiando el test:', error)
		throw new Error('Hubo un problema cambiando el test.')
	}
}

//---------------------------------------------------------------------------------------------------------

//* ABAJO IRAN LAS QUERIES PARA LOS ENDPONTS

//---------------------------------------------------------------------------------------------------------

export const getUsuario = async (documento) => {
	try {
		let user = await prisma.informacionUsuario.findUnique({
			where: {
				documento: documento,
			},
			select: {
				idUsuario: true,
				nombre: true,
				apellido: true,
				correo: true,
				telefonoPersonal: true,
				documento: true,
				tipoDocumento: true,
				testActual: true,
				motivo: true,
				ayudaPsicologica: true,
				flujo: true,
				sesion: true,
				estado: true,
				disponibilidad: true,
			},
		})

		return user
	} catch (error) {
		console.error('Error al obtener el Usuario:', error)
		throw new Error('Hubo un problema al obtener el Usuario.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const getPracticante = async (documento) => {
	try {
		let pract = await prisma.practicante.findUnique({
			where: {
				numero_documento: documento,
			},
		})

		return pract
	} catch (error) {
		console.error('Error al obtener el Practicante:', error)
		throw new Error('Hubo un problema al obtener el Practicante.')
	}
}

//---------------------------------------------------------------------------------------------------------

//Necesito una query de prisma para obtener la cita en estado "pendiente" en base al id del usuario
export const getCita = async (id) => {
	try {
		let cita = await prisma.cita.findMany({
			where: {
				idUsuario: id,
				estado: 'pendiente',
			},
		})
		console.log(cita)
		return cita
	} catch (error) {
		console.error('Error al obtener la Cita:', error)
		throw new Error('Hubo un problema al obtener la Cita.')
	}
}

export const addWebUser = async (
	nombre,
	apellido,
	correo,
	tipoDocumento,
	documento,
	telefonoPersonal
) => {
	try {
		const user = await prisma.informacionUsuario.create({
			data: {
				nombre: nombre,
				apellido: apellido,
				correo: correo,
				tipoDocumento: tipoDocumento,
				documento: documento,
				telefonoPersonal: telefonoPersonal,
			},
		})
		return user
	} catch (error) {
		console.error('Error al crear el usuario:', error)
		throw new Error('Hubo un problema al crear el usuario.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const addWebPracticante = async (
	nombre,
	documento,
	tipoDocumento,
	genero,
	estrato,
	barrio,
	localidad,
	horario
) => {
	try {
		const pract = await prisma.practicante.create({
			data: {
				nombre: nombre,
				numero_documento: documento,
				tipo_documento: tipoDocumento,
				genero: genero,
				estrato: estrato,
				barrio: barrio,
				localidad: localidad,
				horario: horario,
			},
		})
		return pract
	} catch (error) {
		console.error('Error al crear el practicante:', error)
		throw new Error('Hubo un problema al crear el practicante.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const editWebUser = async (
	nombre,
	apellido,
	correo,
	tipoDocumento,
	documento,
	telefonoPersonal
) => {
	try {
		// Buscar al usuario por correo
		let user = await prisma.informacionUsuario.findFirst({
			where: {
				correo: correo,
			},
		})

		// Si no se encuentra por correo, buscar por documento
		if (!user) {
			console.log('No se encontró usuario por correo, buscando por documento:', documento)
			user = await prisma.informacionUsuario.findFirst({
				where: {
					documento: documento,
				},
			})
		}

		// Si no se encuentra por documento, buscar por teléfono
		if (!user) {
			user = await prisma.informacionUsuario.findFirst({
				where: {
					telefonoPersonal: telefonoPersonal,
				},
			})
		}

		// Si no se encuentra el usuario, lanzar un error
		if (!user) {
			throw new Error('No se encontró ningún usuario con los datos proporcionados.')
		} else {
			console.log('Usuario encontrado:', user)
		}

		// Comparar y agregar a updatedData solo los campos que han cambiado
		if (user.nombre !== nombre) {
			const updatedUser = await prisma.informacionUsuario.update({
				where: { idUsuario: user.idUsuario },
				data: { nombre: nombre },
			})
			return updatedUser
		}
		if (user.apellido !== apellido) {
			const updatedUser = await prisma.informacionUsuario.update({
				where: { idUsuario: user.idUsuario },
				data: { apellido: apellido },
			})
			return updatedUser
		}
		if (user.correo !== correo) {
			const updatedUser = await prisma.informacionUsuario.update({
				where: { idUsuario: user.idUsuario },
				data: { correo: correo },
			})
			return updatedUser
		}
		if (user.tipoDocumento !== tipoDocumento) {
			const updatedUser = await prisma.informacionUsuario.update({
				where: { idUsuario: user.idUsuario },
				data: { tipoDocumento: tipoDocumento },
			})
			return updatedUser
		}
		if (user.documento !== documento) {
			const updatedUser = await prisma.informacionUsuario.update({
				where: { idUsuario: user.idUsuario },
				data: { documento: documento },
			})
			return updatedUser
		}
		if (user.telefonoPersonal !== telefonoPersonal) {
			const updatedUser = await prisma.informacionUsuario.update({
				where: { idUsuario: user.idUsuario },
				data: { telefonoPersonal: telefonoPersonal },
			})
			return updatedUser
		}
	} catch (error) {
		console.error('Error al editar el usuario:', error)
		throw new Error('Hubo un problema al editar el usuario.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const editWebPracticante = async (
	nombre,
	documento,
	tipoDocumento,
	genero,
	estrato,
	barrio,
	localidad
) => {
	try {
		const pract = await prisma.practicante.update({
			where: {
				numero_documento: documento,
			},
			data: {
				nombre: nombre,
				tipo_documento: tipoDocumento,
				genero: genero,
				estrato: estrato,
				barrio: barrio,
				localidad: localidad,
			},
		})
		return pract
	} catch (error) {
		console.error('Error al editar el practicante:', error)
		throw new Error('Hubo un problema al editar el practicante.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const citaWebCheckout = async (idCita) => {
	try {
		const cita = await prisma.cita.update({
			where: {
				idCita: idCita,
			},
			data: {
				estado: 'completada',
			},
		})
		return cita
	} catch (error) {
		console.error('Error al cambiar estado de la cita:', error)
		throw new Error('Hubo un problema al crear la cita.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const getWebConsultorios = async () => {
	try {
		const consultorios = await prisma.consultorio.findMany()
		return consultorios
	} catch (error) {
		console.error('Error al obtener los consultorios:', error)
		throw new Error('Hubo un problema al obtener los consultorios.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const ChangeWebConsultorio = async (idConsultorio) => {
	try {
		const consultorio = await prisma.consultorio.update({
			where: {
				idConsultorio: idConsultorio,
			},
			data: {
				activo: 0,
			},
		})
		return consultorio
	} catch (error) {
		console.error('Error al cambiar estado del consultorio:', error)
		throw new Error('Hubo un problema al cambiar estado del consultorio.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const getWebCitas = async (diaActual) => {
	try {
		const citas = await prisma.cita.findMany({
			where: {
				fechaHora: diaActual,
			},
		})
		return citas
	} catch (error) {
		console.error('Error al obtener las citas:', error)
		throw new Error('Hubo un problema al obtener las citas.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const citasPorPaciente = async (idPaciente) => {
	try {
		const citas = await prisma.cita.findMany({
			where: {
				idPaciente: idPaciente,
			},
		})
		return citas
	} catch (error) {
		console.error('Error al obtener las citas:', error)
		throw new Error('Hubo un problema al obtener las citas.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const eliminarCita = async (id) => {
	try {
		const cita = await prisma.cita.deleteMany({
			where: {
				idUsuario: id,
			},
		})
		return cita
	} catch (error) {
		console.error('Error al eliminar la Cita:', error)
		throw new Error('Hubo un problema al eliminar la Cita.')
	}
}

//---------------------------------------------------------------------------------------------------------

export const obtenerPracticante = async (idPracticante) => {
	try {
		const practicante = await prisma.practicante.findUnique({
			where: {
				idPracticante: idPracticante,
			},
		})
		return practicante
	} catch (error) {
		console.error('Error al obtener el Practicante:', error)
		throw new Error('Hubo un problema al obtener el Practicante.')
	}
}
