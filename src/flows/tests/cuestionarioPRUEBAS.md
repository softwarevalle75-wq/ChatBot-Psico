export const iniciarCuestionario = async (numeroUsuario, msg, tipoTest) => {
	const config = cuestionariosConfig[tipoTest]
	if (!config) throw new Error('Tipo de test no reconocido')

	const { preguntas, umbrales, resPreg } = config

	try {
		let estado = await getEstadoCuestionario(numeroUsuario, tipoTest)

		// Si no hay estado, inicializamos el cuestionario
		if (estado.resPreg == null) {
			let respuesta = apiCuest(msg, tipoTest)
			respuesta = Number(respuesta)
			console.log(respuesta)

			estado = {
				Puntaje: 0,
				preguntaActual: 0,
				resPreg: resPreg,
			}
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.Puntaje,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest
			)
			return preguntas[estado.preguntaActual]
		}

		let respuesta = apiCuest(msg, tipoTest)
		respuesta = Number(respuesta)
		if (respuesta == 9) {
			return preguntas[estado.preguntaActual]
		}
		if (estado.preguntaActual < preguntas.length) {
			estado.Puntaje += respuesta
			estado.resPreg[respuesta].push(estado.preguntaActual + 1)

			if (estado.preguntaActual + 1 >= preguntas.length) {
				await saveEstadoCuestionario(
					numeroUsuario,
					estado.Puntaje,
					estado.preguntaActual + 1,
					estado.resPreg,
					tipoTest
				)
				await savePuntajeUsuario(numeroUsuario, estado.Puntaje, estado.resPreg, tipoTest)
				return await evaluarResultado(estado.Puntaje, umbrales)
			}

			estado.preguntaActual += 1
			await saveEstadoCuestionario(
				numeroUsuario,
				estado.Puntaje,
				estado.preguntaActual,
				estado.resPreg,
				tipoTest
			)

			return preguntas[estado.preguntaActual]
		} else {
			return await evaluarResultado(estado.Puntaje, umbrales)
		}
	} catch (error) {
		console.log('error en iniciar cuestionario')
		throw new Error('Hubo un error en iniciar cuestionario')
	}
}

const evaluarResultado = async (puntaje, umbrales) => {
	if (puntaje <= umbrales.bajo.max) {
		return `El cuestionario ha terminado. Su puntaje final es: ${puntaje} \n${umbrales.bajo.mensaje}`
	} else if (puntaje >= umbrales.medio.min && puntaje <= umbrales.medio.max) {
		return `El cuestionario ha terminado. Su puntaje final es: ${puntaje} \n${umbrales.medio.mensaje}`
	} else if (puntaje >= umbrales.alto.min) {
		return `El cuestionario ha terminado. Su puntaje final es: ${puntaje} \n${umbrales.alto.mensaje}`
	} else {
		return 'Hubo un error en su puntaje'
	}
}

const cuestionariosConfig = {
	ghq12: {
		preguntas: [
			'1. ¿Ha podido concentrarse bien en lo que hace?\n    0) Mejor que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
			'2. ¿Sus preocupaciones le han hecho perder mucho el sueño?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',			
		],
		umbrales: {
			bajo: {
				max: 11,
				mensaje: 'No hay presencia de síntomas significativos de malestar psicológico 🟢',
			},
			medio: { min: 12, max: 18, mensaje: 'Hay cierto grado de preocupación emocional 🟡' },
			alto: { min: 19, mensaje: 'Hay un indicador de malestar psicológico significativo 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
			3: [],
		},
	},

	dep: {
		preguntas: [
			'1. Tristeza\n    0) No me siento triste.\n    1) Me siento triste gran parte del tiempo.\n    2) Me siento triste todo el tiempo.\n    3) Me siento tan triste o soy tan infeliz que no puedo soportarlo.',
			'2. Pesimismo\n    0) No estoy desalentado respecto de mi futuro.\n    1) Me siento más desalentado respecto de mi futuro que lo que solía estarlo.\n    2) No espero que las cosas funcionen para mi.\n    3) Siento que no hay esperanza para mi futuro y que sólo puede empeorar.',
			
		],
		umbrales: {
			bajo: { max: 5, mensaje: 'Estado emocional saludable 🟢' },
			medio: { min: 6, max: 10, mensaje: 'Posible depresión leve 🟡' },
			alto: { min: 11, mensaje: 'Posible depresión grave 🔴' },
		},
		resPreg: {
			0: [],
			1: [],
			2: [],
			3: [],
		},
	},
    dass21: {
		/*
		Este cuestionario tiene 3 subescalas:
		Depresión: 3, 5, 10, 13, 16, 17 y 21
		Ansiedad: 2, 4, 7, 9, 15, 19 y 20
		Estrés: 1, 6, 8, 11, 12, 14 y 18
		*/
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
		resPreg: { //se almacena por subescalas
			depresion: [],
			ansiedad: [],
			estres: [],
		},
	},
}