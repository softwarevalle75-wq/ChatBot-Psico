import {
	getEstadoCuestionario,
	saveEstadoCuestionario,
	savePuntajeUsuario,
} from '../../queries/queries.js'

const rtasDass21 = () => {
    return '0) No me ha ocurrido.\n1) Me ha ocurrido un poco, o durante parte del tiempo.\n2) Me ha ocurrido bastante, o durante una buena parte del tiempo.\n3) Me ha ocurrido mucho, o la mayor parte del tiempo'
}

const cuestDass21 = {
    preguntas: [
		'1. Me ha costado mucho descargar la tensión\n' + rtasDass21(),
		'2. Me di cuenta que tenía la boca seca\n' + rtasDass21(),
		'3. No podía sentir ningún sentimiento positivo\n' + rtasDass21(),
		'4. Se me hizo difícil respirar\n' + rtasDass21(),			
		'5. Se me hizo difícil tomar la iniciativa para hacer cosas\n' + rtasDass21(),
		'6. Reaccioné exageradamente en ciertas situaciones\n' + rtasDass21(),
		'7. Sentí que mis manos temblaban\n' + rtasDass21(),
		'8. He sentido que estaba gastando una gran cantidad de energía\n' + rtasDass21(),
		'9. Estaba preocupado por situaciones en las cuales podía tener pánico o en las que podría hacer el ridículo\n' + rtasDass21(),
		'10. He sentido que no había nada que me ilusionara\n' + rtasDass21(),
		'11. Me he sentido inquieto\n' + rtasDass21(),
		'12. Se me hizo difícil relajarme\n' + rtasDass21(),
		'13. Me sentí triste y deprimido\n' + rtasDass21(),
		'14. No toleré nada que no me permitiera continuar con lo que estaba haciendo\n' + rtasDass21(),
		'15. Sentí que estaba al punto de pánico\n' + rtasDass21(),
		'16. No me pude entusiasmar por nada\n' + rtasDass21(),
		'17. Sentí que valía muy poco como persona\n' + rtasDass21(),
		'18. He tendido a sentirme enfadado con facilidad\n' + rtasDass21(),
		'19. Sentí los latidos de mi corazón a pesar de no haber hecho ningún esfuerzo físico\n' + rtasDass21(),
		'20. Tuve miedo sin razón\n' + rtasDass21(),
		'21. Sentí que la vida no tenía ningún sentido\n' + rtasDass21(),
		
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
		bajo: {min: 4, mensaje: 'Ansiedad leve'},
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
	/*
	resPreg: { //se almacena por subescalas
		depresion: [],
		ansiedad: [],
		estres: [],
	},
	*/
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

		if (estado.resPreg && ![0,1,2,3].includes(Number(respuestas))) {
			return 'Respuesta inválida. Debe ser un número entre 0 y 3.'
		}

		if (!estado.resPreg) {
			estado ={
				Puntaje: 0,
				preguntaActual: 0,
				resPreg: { ...cuestDass21.resPreg },
				respuestasDass21: []
			}
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.Puntaje,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest,
				estado.respuestasDass21
			)
			return preguntas[0]
		}

		const respuestaNum = Number(respuestas)
		estado.Puntaje += respuestaNum

		if (!estado.resPreg[respuestaNum]) {
			estado.resPreg[respuestaNum] = []
		}
		estado.resPreg[respuestaNum].push(estado.preguntaActual + 1)

		// Guarda respuesta individual para las subescalas
		estado.respuestasDass21 = estado.respuestasDass21 || []
		estado.respuestasDass21.push(respuestaNum)

		if (estado.preguntaActual < preguntas.length - 1) {
					
			// Guardar estado y puntaje 
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.Puntaje,
				estado.preguntaActual + 1,
				estado.resPreg,
				tipoTest,
				estado.respuestasDass21
			)
			await savePuntajeUsuario(numeroUsuario, estado.Puntaje, estado.resPreg, tipoTest)

			return await evaluarDASS21(
				estado.respuestasDass21, 
				subescalas,
				{
					depresion: cuestDass21.umbralesDep,
					ansiedad: cuestDass21.umbralesAns,
					estres: cuestDass21.umbralesEstr,
				}
			)																											
		}

		estado.preguntaActual += 1 // ← probando ( sino funciona añadir = estado.preguntaActual = siguientePregunta )
		await saveEstadoCuestionario(
			numeroUsuario,
			estado.Puntaje,
			estado.preguntaActual,
			estado.resPreg,
			tipoTest,
			estado.respuestasDass21
		)

		return preguntas[estado.preguntaActual]
	} catch (error) {
		console.error('Error al procesar DASS-21:', error)
		return 'Hubo un error al procesar el cuestionario. Por favor, inténtelo de nuevo más tarde.'
	}
}

const evaluarDASS21 = async (respuestas, subescalas, umbrales) => {
	const resultado = {}

	for (const escala in subescalas) {
		const indices = subescalas[escala]
		const puntaje = indices.reduce((acc, i) => acc + (Number(respuestas[i - 1]) || 0), 0)

		const umbral = umbrales[escala]
		let nivel = 'Sin clasificación'

		if (puntaje >= umbral.muyalto?.min) nivel = umbral.muyalto.mensaje
		else if (puntaje >= umbral.alto?.min && puntaje <= umbral.alto?.max) nivel = umbral.alto.mensaje
		else if (puntaje >= umbral.medio?.min && puntaje <= umbral.medio?.max) nivel = umbral.medio.mensaje
		else if (puntaje >= umbral.bajo?.min && (!umbral.bajo.max || puntaje <= umbral.bajo.max)) nivel = umbral.bajo.mensaje

		resultado[escala] = { puntaje, nivel }
	}

	return `--* DASS-21 COMPLETADO *--
	
	** Resultados por área: **
	
	**Depresion:** ${resultado.depresion.nivel} (${resultado.depresion.puntaje} puntos)
	**Ansiedad:** ${resultado.ansiedad.nivel} (${resultado.ansiedad.puntaje} puntos)
	**Estrés:** ${resultado.estres.nivel} (${resultado.estres.puntaje} puntos)
	
	Los resultados indican el nivel de malestar en cada área. Si tiene alguna preocupación, considere consultar a un profesional de la salud mental.`
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