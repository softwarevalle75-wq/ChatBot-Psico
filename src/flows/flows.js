//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import {
	obtenerUsuario,
	changeTest,
	switchFlujo,
	switchAyudaPsicologica,
} from '../queries/queries.js'
import { apiRegister } from './register/aiRegister.js'
import { apiAssistant1 } from './assist/aiAssistant.js'
import { apiAssistant2 } from './assist/assistant2.js'
import { procesarMensaje, resetEstadoUsuario, testValido } from './tests/proccesTest.js'
import { mostrarMenuTests, parsearSeleccionTest, TIPOS_TEST} from './tests/controlTest.js'
import { apiAgend } from './agend/aiAgend.js'

//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
	async (ctx, { gotoFlow, state }) => {
		const user = await obtenerUsuario(ctx.from)
		await state.update({ user: user })
		console.log(user.flujo)

		resetEstadoUsuario(ctx.from)

		switch (user.flujo) {
			case 'assistantFlow':
				console.log('assistantFlow')
				return gotoFlow(assistantFlow)
			case 'testFlow':
				console.log('testFlow')
				return gotoFlow(testFlow)
			case 'agendFlow':
				console.log('agendFlow')
				return gotoFlow(agendFlow)

			default:
				console.log('registerFlow')
				return gotoFlow(registerFlow)
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
	async (ctx, { flowDynamic }) => {
		await flowDynamic(await apiRegister(ctx.from, ctx.body))
	}
)

//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')

		//--------------- Bot reconoce dass21
		const msg = ctx.body.toLowerCase()

		if(
			msg.includes('dass21') ||
			msg.includes('dass-21') ||
			msg.includes('estado emocional') ||
			msg.includes('test emocional') ||
			msg.includes('evaluar emociones') 
		) {
			await changeTest(ctx.from, TIPOS_TEST.DASS21)
			user.testActual = TIPOS_TEST.DASS21
			await state.update({ user: user })
			await switchFlujo(ctx.from, 'testFlow')
			await flowDynamic('Perfecto, empecemos con el cuestionario DASS-21')
			return gotoFlow(testFlow)
		}

		//----------------- Bot reconoce ghq12

		if(
			msg.includes('ghq12') ||
			msg.includes('ghq-12') ||
			msg.includes('estado emocional') ||
			msg.includes('test emocional') ||
			msg.includes('evaluar emociones')
		) {
			await changeTest(ctx.from, TIPOS_TEST.GHQ12)
			user.testActual = TIPOS_TEST.GHQ12
			await state.update({ user: user })
			await switchFlujo(ctx.from, 'testFlow')
			await flowDynamic('Perfecto, empecemos con el cuestionario GHQ-12')
			return gotoFlow(testFlow)
		}

		//----------------- Bot reconoce solicitud de tests 
		if (
			msg.includes('test') ||
			msg.includes('prueba') ||
			msg.includes('cuestionario') ||
			msg.includes('evaluación') ||
			msg.includes('evaluar') 
		) {
			await flowDynamic(mostrarMenuTests())
			return
		}

		// Se procesa la selección del tests
		const testSeleccionado = parsearSeleccionTest(msg)
		if (tipoTestSeleccionado) {
			await changeTest(ctx.from, testSeleccionado)
			user.testActual = tipoTestSeleccionado
			await state.update({ user: user })
			await switchFlujo(ctx.from, 'testFlow')

			const nombreTest = testSeleccionado === TIPOS_TEST.GHQ12 ? 'GHQ-12' : 'DASS-21'
			await flowDynamic(`Seleccionaste ${nombreTest}. Comencemos con el cuestionario.`)
			return gotoFlow(testFlow)
		}

		// La lógica original

		if (user.ayudaPsicologica == 2) {
			await switchFlujo(user.telefonoPersonal, 'testFlow')
			return gotoFlow(testFlow)
		} else if (user.ayudaPsicologica == 0) {
			const assist = await apiAssistant2(ctx.from, ctx.body, user.idUsuario)
			await flowDynamic(assist)
		} else {
			const assist = await apiAssistant1(ctx.from, ctx.body)
			await flowDynamic(assist)
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const testFlow = addKeyword(utils.setEvent('TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')

		// Validar el test actual
		if (!testValido(user.testActual)) {
			await flowDynamic(
				'El tipo de test actual no es válido. Por favor, selecciona un test válido.'
			)
			await switchFlujo(ctx.from, 'assistantFlow')
			return gotoFlow(assistantFlow)

		}

		try {
			// Procesar mensaje del usuario
			const message = await procesarMensaje(ctx.from, ctx.body, user.testActual)
	
			if (!message || typeof message !== 'string') {
				console.error('Error: procesarMensaje returned an invalid value.', { message })
				await flowDynamic(
					'Ocurrió un error procesando el mensaje. Por favor, inténtelo de nuevo.'
				)
				return
			}
			
			await flowDynamic(message)

			if (message.includes('GHQ-12 COMPLETADO') && user.testActual === TIPOS_TEST.GHQ12) {
				await flowDynamic('Has completado el cuestionario GHQ-12. Ahora puedes agendar una cita con nuestros profesionales')
				await switchFlujo(ctx.from, 'agendFlow')
				return gotoFlow(agendFlow)
			}

			else if (message.includes('DASS-21 COMPLETADO') && user.testActual === TIPOS_TEST.DASS21) {
				await flowDynamic('Has completado el cuestionario DASS-21. Ahora puedes agendar una cita con nuestros profesionales')
				await switchFlujo(ctx.from, 'agendFlow')
				return gotoFlow(agendFlow)
			}

		} catch (error) {
			console.error('Error en testFlow:', error)
			await flowDynamic('Ocurrió un error al procesar la prueba. Porfavor intenta nuevamente')
		}


		// if (message.includes('El cuestionario ha terminado.')) {
		// 	if (user.testActual == 'ghq12') {
		// 		const { infoCues, preguntasString } = await getInfoCuestionario(
		// 			ctx.from,
		// 			user.testActual
		// 		)
		// 		const historialContent = `De las preguntas ${preguntasString}, el usuario respondio asi: ${JSON.stringify(
		// 			infoCues
		// 		)}`

		// 		const accion = `Debes analizar las respuestas del usuario y asignarle en lo que más grave está
		// 			Entre las siguientes opciones:
		// 			"dep"(depresión)
		// 			"ans"(ansiedad)
		// 			"estr"(estrés)
		// 			"suic"(ideacion suicida)
		// 			"calVida"(Calidad de vida)
		// 			Responde unicamente con "dep", "ans", "estr", "suic" o "calVida"
		// 		`
		// 		const hist = user.historial
		// 		hist.push({ role: 'system', content: historialContent })
		// 		let test = await apiBack1(hist, accion)
		// 		test = test.replace(/"/g, '') // Elimina todas las comillas

		// 		const nuevoTest = await changeTest(ctx.from, test)
		// 		await flowDynamic(await procesarMensaje(ctx.from, ctx.body, nuevoTest))
		// 	} else {
		// 		await switchFlujo(ctx.from, 'agendFlow')
		// 		return gotoFlow(agendFlow)
		// 	}
		// }
	}
)

//---------------------------------------------------------------------------------------------------------

export const agendFlow = addKeyword(utils.setEvent('AGEND_FLOW')).addAction(
	async (ctx, { flowDynamic, state }) => {
		const user = state.get('user')

		try{
			const msgAgend = await apiAgend(ctx.from, ctx.body, user)

			if (msgAgend.includes('Se ha registrado su cita para el día')) {
				await switchAyudaPsicologica(ctx.from, 0)
				user.ayudaPsicologica = 0
				await state.update({ user: user })
				await switchFlujo(ctx.from, 'assistantFlow')

				resetEstadoUsuario(ctx.from)

				await flowDynamic(msgAgend)
			} else{
				await flowDynamic(msgAgend)
			}
		} catch (error) {
			console.error('Error en agendFlow:', error)
			await flowDynamic('Ocurrió un error al procesar la agenda. Intenta nuevamente')
		}
	}
)