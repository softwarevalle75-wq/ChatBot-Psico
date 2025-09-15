import {
	getEstadoCuestionario,
	saveEstadoCuestionario,
	savePuntajeUsuario,
	obtenerTelefonoPracticante,
	sendAutonomousMessage,
} from '../../queries/queries.js'

import { generarPDFResultadosDASS21 } from './testPDF_DASS21.js'
import fs from 'fs'

const rtasDass21 = () => {
    return '0️⃣ No me ha ocurrido.\n    1️⃣ Me ha ocurrido un poco, o durante parte del tiempo.\n    2️⃣ Me ha ocurrido bastante, o durante una buena parte del tiempo.\n    3️⃣ Me ha ocurrido mucho, o la mayor parte del tiempo'
}

//--------------------------------------------------------------------------------

let globalProvider = null;

export const configurarProviderDASS21 = (provider) => {
    globalProvider = provider;
    console.log('👍 Provider configurado para envío de PDFs DASS-21')
}

const cuestDass21 = {
    preguntas: [
		'1. Me ha costado mucho descargar la tensión\n    ' + rtasDass21(),
		'2. Me di cuenta que tenía la boca seca\n    ' + rtasDass21(),
		'3. No podía sentir ningún sentimiento positivo\n    ' + rtasDass21(),
		/*
		'4. Se me hizo difícil respirar\n    ' + rtasDass21(),			
		'5. Se me hizo difícil tomar la iniciativa para hacer cosas\n    ' + rtasDass21(),
		'6. Reaccioné exageradamente en ciertas situaciones\n    ' + rtasDass21(),
		'7. Sentí que mis manos temblaban\n    ' + rtasDass21(),
		'8. He sentido que estaba gastando una gran cantidad de energía\n    ' + rtasDass21(),
		'9. Estaba preocupado por situaciones en las cuales podía tener pánico o en las que podría hacer el ridículo\n    ' + rtasDass21(),
		'10. He sentido que no había nada que me ilusionara\n    ' + rtasDass21(),
		'11. Me he sentido inquieto\n    ' + rtasDass21(),
		'12. Se me hizo difícil relajarme\n    ' + rtasDass21(),
		'13. Me sentí triste y deprimido\n    ' + rtasDass21(),
		'14. No toleré nada que no me permitiera continuar con lo que estaba haciendo\n    ' + rtasDass21(),
		'15. Sentí que estaba al punto de pánico\n    ' + rtasDass21(),
		'16. No me pude entusiasmar por nada\n    ' + rtasDass21(),
		'17. Sentí que valía muy poco como persona\n    ' + rtasDass21(),
		'18. He tendido a sentirme enfadado con facilidad\n    ' + rtasDass21(),
		'19. Sentí los latidos de mi corazón a pesar de no haber hecho ningún esfuerzo físico\n    ' + rtasDass21(),
		'20. Tuve miedo sin razón\n    ' + rtasDass21(),
		'21. Sentí que la vida no tenía ningún sentido\n    ' + rtasDass21(),
	*/
		],

	subescalas: {
		depresion: [3, 5, 10, 13, 16, 17, 21],
		ansiedad: [2, 4, 7, 9, 15, 19, 20],
		estres: [1, 6, 8, 11, 12, 14, 18],
	},

	umbralesDep: {
		bajo: {min: 5, max: 6, mensaje: 'Depresión leve'},
		medio: {min: 7, max: 10, mensaje: 'Depresión moderada'},
		alto: {min: 11, max: 13, mensaje: 'Depresión severa'},
		muyalto: {min: 14, mensaje: 'Depresión extremadamente severa'},
	},
	umbralesAns: {
		bajo: {min: 4, max: 4, mensaje: 'Ansiedad leve'},
		medio: {min: 5, max: 7, mensaje: 'Ansiedad moderada'},
		alto: {min: 8, max: 9, mensaje: 'Ansiedad severa'},
		muyalto: {min: 10, mensaje: 'Ansiedad extremadamente severa'},
	},
	umbralesEstr: {
		bajo: {min: 8, max: 9, mensaje: 'Estrés leve'},
		medio: {min: 10, max: 12, mensaje: 'Estrés moderado'},
		alto: {min: 13, max: 16, mensaje: 'Estrés severo'},
		muyalto: {min: 17, mensaje: 'Estrés extremadamente severo'},
	},
	resPreg: {
		0: [],
		1: [],
		2: [],
		3: [],			
	}
}

export const procesarDass21 = async (numeroUsuario, respuestas) => {
	const tipoTest = 'dass21'
	const { preguntas, subescalas } = cuestDass21

	console.log('Procesando DASS-21 para el usuario:', numeroUsuario)

	try {
		let estado = await getEstadoCuestionario(numeroUsuario, tipoTest)
		//console.log('🔍 Estado recuperado de BD:', JSON.stringify(estado, null, 2))

		if (estado.resPreg && ![0,1,2,3].includes(Number(respuestas))) {
			return 'Respuesta inválida. Debe ser un número entre 0 y 3.'
		}

		// permite que el cuestionario inicie desde la pregunta 1
		if (!estado.resPreg || Object.keys(estado.resPreg).length === 0) {
			estado = {
				preguntaActual: 0,
				resPreg: { ...cuestDass21.resPreg },
				respuestas: []
			}
			//console.log('🔍 Estado inicial creado:', JSON.stringify(estado, null, 2))

			await saveEstadoCuestionario(
				numeroUsuario,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest,
				estado.respuestas
			)
			console.log('📝 Iniciando cuestionario, mostrando pregunta 1')
			return preguntas[0]
		}

		// if (respuestas === null) {
		// 	return preguntas[estado.preguntaActual]
		// }

		if (![0,1,2,3].includes(Number(respuestas))) {
			return 'Respuesta inválida. Debe ser un número entre 0 y 3'
		}

		const respuestaNum = Number(respuestas)
		console.log(`Procesando respuesta ${respuestaNum} para pregunta ${estado.preguntaActual + 1}`)

		console.log('🔍 Estado ANTES de agregar respuesta:', JSON.stringify(estado, null, 2))
		if (!estado.resPreg[respuestaNum]) {
			estado.resPreg[respuestaNum] = []
		}
		estado.resPreg[respuestaNum].push(estado.preguntaActual + 1)

		if (!estado.respuestas) {
			console.log('⚠️  ARRAY respuestas NO EXISTE, creándolo...')
			estado.respuestas = []
		}

		estado.respuestas.push(respuestaNum)
		
		console.log(`📊 Respuestas guardadas hasta ahora: [${estado.respuestas.join(', ')}]`)
		console.log(`📊 Total respuestas: ${estado.respuestas.length}/21`)

		//console.log('🔍 Estado DESPUÉS de agregar respuesta:', JSON.stringify(estado, null, 2))

		estado.preguntaActual += 1

		// Verificar si terminamos
		if (estado.preguntaActual >= preguntas.length) {
			console.log('🎉 Cuestionario completado, calculando puntajes...')	

			const puntajes = calcularPuntajesSubescalas(estado.respuestas, subescalas)
			
			// Guardar estado y puntaje
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest,
				estado.respuestas
			)
			await savePuntajeUsuario(
				numeroUsuario, 
				tipoTest,
				puntajes.depresion,
				puntajes.ansiedad,
				puntajes.estres,
				estado.resPreg, 
			)

			const resultados = await evaluarDASS21(
				puntajes,
				{
					depresion: cuestDass21.umbralesDep,
					ansiedad: cuestDass21.umbralesAns,
					estres: cuestDass21.umbralesEstr,
				}
			);

			// Enviar resultados al practicante con PDF
			try {
				const telefonoPracticante = await obtenerTelefonoPracticante(numeroUsuario);
				if (telefonoPracticante) {
					const mensajeInicial = `🔔 *📋 TEST DASS-21 COMPLETADO - GENERANDO REPORTE*\n\n`;
					
					await sendAutonomousMessage(telefonoPracticante, mensajeInicial);

					// Generar PDF
					const rutaPDF = await generarPDFResultadosDASS21(
						numeroUsuario,
						puntajes,
						estado.resPreg
					);

					console.log('PDF DASS-21 generado: ', rutaPDF);

					// Enviar PDF al practicante
					setTimeout(async() => {
						try {
							if (globalProvider) {
								try{
									// Enviar PDF con sendMedia
									const numeroCompleto = telefonoPracticante.includes('@') 
										? telefonoPracticante 
										: `${telefonoPracticante}@s.whatsapp.net`;
									
									await globalProvider.sendMedia(
										numeroCompleto,
										rutaPDF,
										'📊 *Reporte DASS-21*'
									);									

									// 🔥 MARCAR TEST COMPLETADO PARA SALIR DE ESPERANDO RESULTADOS
									setTimeout(async () => {
										await sendAutonomousMessage(
											telefonoPracticante,
											"_Para continuar, escribe cualquier mensaje._"
										)
									}, 1000);

									console.log('PDF DASS-21 enviado exitosamente via provider')
								} catch (providerError) {
									console.log('Error con provider DASS-21, usando fallback')
									throw providerError;
								}
							} else {
								throw new Error('Provider no configurado para DASS-21')
							}

						} catch (error) {
							console.log('Error al enviar el PDF DASS-21', error)
							
							await sendAutonomousMessage(
								telefonoPracticante,
								`🔔 *🧠 RESULTADOS DASS-21*\n\n` +
								`👤 *Paciente:* ${numeroUsuario}\n` +
								`📊 *Resultados obtenidos:*\n${resultados}`
							)
						}

						setTimeout(() => {
							try {
								fs.unlinkSync(rutaPDF)
								console.log('PDF DASS-21 eliminado exitosamente')
							} catch (error) {
								console.log('Error al eliminar el PDF DASS-21', error)
							}
						}, 30000)
					}, 3000)

				} else {
					console.log('No se pudo obtener teléfono del practicante para DASS-21')
				}
			} catch (error) {
				console.error('Error procesando resultados DASS-21', error)
			}

			return "✅ *Prueba completada con éxito.*\n\nGracias por completar la evaluación. Los resultados han sido enviados a tu practicante asignado."
		}

		console.log('🔍 Guardando estado en BD:', JSON.stringify(estado, null, 2))

		await saveEstadoCuestionario(
			numeroUsuario,
			estado.preguntaActual,
			estado.resPreg,
			tipoTest,
			estado.respuestas
		)

		console.log(`➡️  Mostrando pregunta ${estado.preguntaActual + 1}`)
		return preguntas[estado.preguntaActual]
		
	} catch (error) {
		console.error('Error al procesar DASS-21:', error)
		return 'Hubo un error al procesar el cuestionario. Por favor, inténtelo de nuevo más tarde.'
	}
}

const calcularPuntajesSubescalas = (respuestas, subescalas) => {
	const puntajes = {}

	console.log('Respuestas recibidas:', respuestas)
	console.log('Subescalas:', subescalas)

	for (const escala in subescalas) {
		const indices = subescalas[escala]
		console.log(`\n=== Procesando ${escala} ===`)
		console.log('Índices de preguntas:', indices)
		
		let puntajeBase = 0
		
		indices.forEach(preguntaNum => {
			const respuesta = Number(respuestas[preguntaNum - 1]) || 0
			puntajeBase += respuesta
			console.log(`Pregunta ${preguntaNum}: respuesta = ${respuesta}`)
		})
		
		// Multiplicar por 2 según estándar DASS-21
		puntajes[escala] = puntajeBase * 1
		
		console.log(`${escala}: suma=${puntajeBase}, puntajeFinal=${puntajes[escala]}`)
	}

	console.log('Puntajes finales calculados:', puntajes)
	return puntajes
}

export const evaluarDASS21 = async (puntajes, umbrales) => {
	const resultado = {}

	console.log('=== EVALUANDO DASS-21 ===')
	console.log('Puntajes recibidos:', puntajes)
	console.log('Umbrales recibidos:', umbrales)

	// Verificar que todas las escalas existan
	const escalasEsperadas = ['depresion', 'ansiedad', 'estres']
	
	for (const escala of escalasEsperadas) {
		if (puntajes[escala] === undefined) {
			console.error(`❌ FALTA PUNTAJE PARA: ${escala}`)
			resultado[escala] = { puntaje: 0, nivel: 'Error - datos incompletos' }
			continue
		}

		const puntaje = puntajes[escala];
		const u = umbrales[escala];
		let nivel = 'Normal';

		console.log(`\nEvaluando ${escala}: puntaje=${puntaje}`)

		// Evaluar desde el más alto al más bajo
		if (u.muyalto && puntaje >= u.muyalto.min) {
			nivel = u.muyalto.mensaje;
			console.log(`-> ${nivel} (>= ${u.muyalto.min})`)
		} else if (u.alto && puntaje >= u.alto.min && (u.alto.max === undefined || puntaje <= u.alto.max)) {
			nivel = u.alto.mensaje;
			console.log(`-> ${nivel} (${u.alto.min}-${u.alto.max || '∞'})`)
		} else if (u.medio && puntaje >= u.medio.min && (u.medio.max === undefined || puntaje <= u.medio.max)) {
			nivel = u.medio.mensaje;
			console.log(`-> ${nivel} (${u.medio.min}-${u.medio.max || '∞'})`)
		} else if (u.bajo && puntaje >= u.bajo.min && (u.bajo.max === undefined || puntaje <= u.bajo.max)) {
			nivel = u.bajo.mensaje;
			console.log(`-> ${nivel} (${u.bajo.min}-${u.bajo.max || '∞'})`)
		} else {
			console.log(`-> ${nivel} (< ${u.bajo.min})`)
		}

		resultado[escala] = { puntaje, nivel };
	}

	console.log('Resultado final:', resultado)

	return `== DASS-21 COMPLETADO ==

  ** Resultados por área: **

  **Depresión:** ${resultado.depresion.nivel} (${resultado.depresion.puntaje} puntos)
  **Ansiedad:** ${resultado.ansiedad.nivel} (${resultado.ansiedad.puntaje} puntos)
  **Estrés:** ${resultado.estres.nivel} (${resultado.estres.puntaje} puntos)`;
}


export const DASS21info = () => {
	return {
		nombre: 'DASS-21',
		descripcion: 'Escala de Depresión, Ansiedad y Estrés de 21 ítems',
		numPreguntas: cuestDass21.preguntas.length,
		subescalas: Object.keys(cuestDass21.subescalas),
		tiempoEstimado: '10-15 minutos',
	}
}