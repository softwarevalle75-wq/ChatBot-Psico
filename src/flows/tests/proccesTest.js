/*  ------------------------ processMensaje.js ------------------------
	Este archivo se encarga de manejar la logica del flujo de mensajes
	para el tratamiento de datos y cuestionarios de la aplicacion
	Aca se hacen varias validaciones para llevar al usuario al 
	Cuestionario correspondiente.
	--------------------------------------------------------------------
*/
import axios from 'axios'
import { procesarTest } from './controlTest.js'

const estadoUsuarios = new Map()

const mensajesTest = {
	//---- Principales
	ghq12: 'A continuación, te presentaremos el cuestionario GHQ-12. Es una forma sencilla de conocer un poco mejor cómo te has sentido en las últimas dos semanas. Tus respuestas son muy valiosas para nosotros y, por supuesto, serán tratadas con total confidencialidad.',
	dep: 'Te invitamos a completar el Inventario de Depresión de Beck (BDI-2). Este cuestionario te ayudará a describir cómo te has sentido últimamente. Recuerda, tus respuestas son confidenciales y nos servirán para entenderte mejor.',
	//---- Secundarios
	ans: 'El Inventario de Ansiedad de Beck (BAI) te permitirá compartir cómo la ansiedad ha influido en tu vida en la última semana. Tus respuestas son importantes para nosotros y serán tratadas con el cuidado que merecen.',
	estr: 'Te presentaremos el Inventario de Estrés de escala percibida. Queremos saber cómo has vivido el estrés en el último mes. Tus respuestas son confidenciales y nos ayudarán a comprender tu experiencia.',
	calvida: 'Este cuestionario te permitirá reflexionar sobre tu calidad de vida. Tus respuestas son muy importantes para nosotros y nos ayudarán a conocerte mejor.',
	suic: 'La Escala de Ideación Suicida es una herramienta que nos ayudará a comprender tus pensamientos y sentimientos. Recuerda, no estás solo y tus respuestas serán tratadas con la mayor confidencialidad.',
	dass21: 'El Cuestionario DASS-21 es una herramienta que nos permitirá evaluar tus niveles de depresión, ansiedad y estrés. Tus respuestas son confidenciales y nos ayudarán a entenderte mejor.'
}

// Verificar si es primera vez que realiza cada cuestionario
function primeraVezTest(numeroUsuario, tipoTest){
	if (!estadoUsuarios.has(numeroUsuario)) {
		estadoUsuarios.set(numeroUsuario, {ghq12: true, dass21: true})
	}

	const estadoUsuario = estadoUsuarios.get(numeroUsuario)
	return estadoUsuario[tipoTest] === true
}

// Mostrar mensaje de bienvenida una vez
function marcarTestVisto(numeroUsuario, tipoTest) {
	if (!estadoUsuarios.has(numeroUsuario)) {
		estadoUsuarios.set(numeroUsuario, {ghq12: true, dass21: true})
	}

	const estadoUsuario = estadoUsuarios.get(numeroUsuario)
	estadoUsuario[tipoTest] = false
	estadoUsuarios.set(numeroUsuario, estadoUsuario)
}

export async function procesarMensaje(numeroUsuario, mensaje, tipoTest) {
	console.log(tipoTest)

	if (!testValido(tipoTest)) {
		return 'Prueba no válida. Las pruebas disponibles son: GHQ-12 y DASS-21'
	}

	try{
		// Muestra bienvenida solo una vez
		if (primeraVezTest(numeroUsuario, tipoTest)){
			marcarTestVisto(numeroUsuario, tipoTest)

			await axios.post('http://localhost:3000/v1/messages', {
				number: numeroUsuario,
				message: mensajesTest[tipoTest],
			})
		}

		return await procesarTest(numeroUsuario, mensaje, tipoTest);
 	} catch (error){
		console.error('Error procesando test:', error)
		return 'Ocurrió un error al procesar la prueba. Intenta nuevamente'
	}
}

export function testValido(tipoTest) {
	return tipoTest === 'ghq12' || tipoTest === 'dass21'
}

export function resetEstadoUsuario(numeroUsuario) {
	if (estadoUsuarios.has(numeroUsuario)) {
		estadoUsuarios.delete(numeroUsuario)
		console.log(`Se reseteó el estado del usuario: ${numeroUsuario}`)
	}
}

export function resetTestUsuario(numeroUsuario, tipoTest) {
	if (estadoUsuarios.has(numeroUsuario)) {
		const estadoUsuario = estadoUsuarios.get(numeroUsuario)
		estadoUsuario[tipoTest] = true
		estadoUsuarios.set(numeroUsuario, estadoUsuario)
		console.log(`Test ${tipoTest} reseteado para usuario: ${numeroUsuario}`)
	}
}
