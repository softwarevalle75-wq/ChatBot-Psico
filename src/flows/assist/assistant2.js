import OpenAI from 'openai'
import { obtenerHist, saveHist, getCita, obtenerResultadosPaciente, obtenerPacientesAsignados } from '../../queries/queries.js'
import { assistantPrompt } from '../../openAi/prompts.js'
import { formatearResultadosParaIA, formatearListaPacientes } from '../../openAi/resultFormatter.js'
import { format } from '@formkit/tempo'

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

const tools = [
	{
		type: 'function',
		function: {
			name: 'consultarCita',
			description: 'Da los detalles de la cita agendada',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'reAgendarCita',
			description:
				'Re agenda una cita, el usuario tiene que proveer la informacion de el dia la hora (No de fecha). Si no tienes la informacion de la fecha de reagendamiento, no podras ejecutar esta funcion',
			parameters: {
				type: 'object',
				properties: {
					nuevoHorario: {
						type: 'string',
						description:
							'Dia/s y Hora/s a la que la cita va a ser reagendada, en lenguaje natural',
					},
				},
				required: ['nuevoHorario'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'cancelarCita',
			description: 'Cancel an existing appointment',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'consultarResultadosPaciente',
			description: 'Consulta los resultados de tests psicológicos de un paciente específico usando su número de teléfono',
			parameters: {
				type: 'object',
				properties: {
					telefonoPaciente: {
						type: 'string',
						description: 'Número de teléfono del paciente (solo números, sin prefijos)',
					},
				},
				required: ['telefonoPaciente'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'listarPacientesAsignados',
			description: 'Lista todos los pacientes asignados al practicante actual',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

export async function apiAssistant2(numero, msg, id) {
	const conversationHistory = await obtenerHist(numero)
	conversationHistory.unshift({
		role: 'system',
		content: assistantPrompt,
	})

	conversationHistory.push({ role: 'user', content: msg })

	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			tools: tools,
			tool_choice: 'auto',
		})
		const assistantResponse = response.choices[0].message.content
		const toolCalls = response.choices[0].message.tool_calls

		const { prompt_tokens, completion_tokens, total_tokens } = response.usage;

		console.log(`✨ Uso de tokens en 'assistant': \nTokens por prompt: → ${prompt_tokens} \n Tokens por respuesta: → ${completion_tokens} \n Tokens en total: → ${total_tokens}`)
		//console.log("✨ Uso de tokens en 'assistant': ",)

		conversationHistory.shift()

		if (toolCalls && toolCalls.length > 0) {
			for (const call of toolCalls) {
				console.log(call)
				if (call.type === 'function') {
					if (call.function.name === 'consultarCita') {
						console.log('consultarCita')
						const dia = await getCita(id)
						const cita = format(dia[0].fechaHora, 'dddd, D MMMM HH:mm', 'es')

						conversationHistory.push({
							role: 'assistant',
							content: `Se ha registrado su cita para el día ${cita}`,
						})

						// Guardar el historial actualizado
						conversationHistory.shift() // Remover el prompt del sistema
						await saveHist(numero, conversationHistory)

						return `Su cita está agendada para el dia ${cita}`
					}
					//! -----------------------------------------------------------------------------
					if (call.function.name === 'reAgendarCita') {
						conversationHistory.push({
							role: 'assistant',
							content: `Se ha reagendado su cita para el día Solicitado`,
						})

						conversationHistory.shift() // Remover el prompt del sistema
						await saveHist(numero, conversationHistory)
						return `Se ha reagendado su cita para el día Solicitado`
					}

					if (call.function.name === 'cancelarCita') {
						conversationHistory.push({
							role: 'assistant',
							content: `Se ha sido cancelada, recuerde que a la segunda cancelada, se le cerrarra su proceso.`,
						})

						conversationHistory.shift() // Remover el prompt del sistema
						await saveHist(numero, conversationHistory)
						return `Se ha sido cancelada, recuerde que a la segunda cancelada, se le cerrarra su proceso.`
					}

					// Consultar resultados de paciente
					if (call.function.name === 'consultarResultadosPaciente') {
						console.log('🔍 consultarResultadosPaciente iniciado')
						const { telefonoPaciente } = JSON.parse(call.function.arguments)
						console.log(`🔍 Teléfono recibido del usuario: ${telefonoPaciente}`)


						try {
							// Pasar el número tal como viene, la función obtenerResultadosPaciente manejará la normalización
							const resultados = await obtenerResultadosPaciente(telefonoPaciente)
							
							if (!resultados) {
								console.log('❌ No se encontraron resultados para este paciente')
								return 'No se encontraron resultados para este paciente. Verifica que el número de teléfono sea correcto.'
							}

							const datosCrudos = formatearResultadosParaIA(resultados)
							
							if (!datosCrudos) {
								return 'No se encontraron datos válidos para este paciente.'
							}

							// Detectar qué prueba específica quiere el practicante
							const mensajeOriginal = msg.toLowerCase()
							const quiereGHQ12 = mensajeOriginal.includes('ghq') || mensajeOriginal.includes('ghq-12') || mensajeOriginal.includes('ghq12') || mensajeOriginal.includes('salud mental general')
							const quiereDASS21 = mensajeOriginal.includes('dass') || mensajeOriginal.includes('dass-21') || mensajeOriginal.includes('dass21') || mensajeOriginal.includes('depresión') || mensajeOriginal.includes('ansiedad') || mensajeOriginal.includes('estrés')
							
							// Filtrar datos según lo que pidió
							const datosCompletos = JSON.parse(datosCrudos)
							let datosFiltrados = {
								paciente: datosCompletos.paciente
							}

							// Lógica de filtrado
							if (quiereGHQ12 && !quiereDASS21) {
								// Solo GHQ-12
								datosFiltrados.ghq12 = datosCompletos.ghq12
								datosFiltrados.dass21 = null
								console.log('🎯 Solicitud específica: Solo GHQ-12')
							} else if (quiereDASS21 && !quiereGHQ12) {
								// Solo DASS-21
								datosFiltrados.ghq12 = null
								datosFiltrados.dass21 = datosCompletos.dass21
								console.log('🎯 Solicitud específica: Solo DASS-21')
							} else {
								// Ambas pruebas (por defecto o si menciona ambas)
								datosFiltrados = datosCompletos
								console.log('🎯 Solicitud: Ambas pruebas')
							}

							console.log('✅ Datos filtrados preparados para GPT')

							// GPT analiza SOLO las pruebas solicitadas
							const analisisSystem = {
								role: 'system',
								content: `Eres un asistente clínico especializado para practicantes de psicología. Recibirás datos crudos de pruebas psicológicas (GHQ-12 y/o DASS-21) en formato JSON.

Tu trabajo es generar un análisis completo y profesional que incluya:

1. **Información del paciente** (nombre, teléfono, fecha registro)
2. **Estado de cada prueba disponible:**
   - Si está EN PROGRESO: usa "preguntasRespondidas" para indicar cuántas preguntas ha completado y da una orientación preliminar prudente SIN revelar puntajes parciales
   - Si está COMPLETADA: proporciona puntajes, interpretación clínica según umbrales estándar, y recomendaciones
   - Si es null: no menciones esa prueba

**Umbrales GHQ-12:**
- 0-11: Sin síntomas significativos
- 12-18: Preocupación emocional moderada  
- 19+: Malestar psicológico significativo

**Umbrales DASS-21:**
Depresión: Normal(0-4), Leve(5-6), Moderada(7-10), Severa(11-13), Extrema(14+)
Ansiedad: Normal(0-3), Leve(4), Moderada(5-7), Severa(8-9), Extrema(10+)
Estrés: Normal(0-7), Leve(8-9), Moderado(10-12), Severo(13-16), Extremo(17+)

Tono: Profesional, empático, orientado a la acción clínica. Máximo 10-12 líneas.`
							}
							
							const analisisUser = {
								role: 'user',
								content: `Analiza estos datos de pruebas psicológicas y genera un reporte para el practicante (solo incluye las pruebas que no sean null):\n\n${JSON.stringify(datosFiltrados, null, 2)}`
							}

							let analisisCompleto = ''
							try {
								const respuesta = await aiRegister.chat.completions.create({
									model: 'gpt-4o-mini',
									messages: [analisisSystem, analisisUser],
									temperature: 0.2,
								})

								//información sobre el uso de tokens
								const { prompt_tokens, completion_tokens, total_tokens } = respuesta.usage;
								console.log(`✨ Uso de tokens en 'analisis': \nTokens por prompt: → ${prompt_tokens} \n Tokens por respuesta: → ${completion_tokens} \n Tokens en total: → ${total_tokens}`)
								
								analisisCompleto = respuesta.choices?.[0]?.message?.content?.trim() || 'No se pudo generar el análisis.'
							} catch (e) {
								console.error('❌ Error generando análisis con GPT:', e?.message)
								return 'Error al procesar los resultados del paciente. Intenta nuevamente.'
							}

							
							conversationHistory.push({
								role: 'assistant',
								content: analisisCompleto,
							})

							conversationHistory.shift() // Remover el prompt del sistema
							await saveHist(numero, conversationHistory)

							return analisisCompleto
						} catch (error) {
							console.error('❌ Error consultando resultados:', error)
							return 'No se pudieron obtener los resultados del paciente. Verifica que el número de teléfono sea correcto.'
						}
					}

					// Listar pacientes asignados
					if (call.function.name === 'listarPacientesAsignados') {
						console.log('listarPacientesAsignados')
						
						try {
							const pacientes = await obtenerPacientesAsignados(id)
							const listaFormateada = formatearListaPacientes(pacientes)
							
							conversationHistory.push({
								role: 'assistant',
								content: listaFormateada,
							})

							conversationHistory.shift() // Remover el prompt del sistema
							await saveHist(numero, conversationHistory)
							
							return listaFormateada
						} catch (error) {
							console.error('Error listando pacientes:', error)
							return 'No se pudieron obtener los pacientes asignados.'
						}
					}

					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return assistantResponse
				}
			}
		} else {
			console.log('else')
			await saveHist(numero, conversationHistory)
			return assistantResponse
		}
	} catch (error) {
		console.error('Error processing OpenAI request:', error)
		throw new Error('Failed to process the request.')
	}
}
