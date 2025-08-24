import {
	getEstadoCuestionario,
	saveEstadoCuestionario,
	savePuntajeUsuario,
} from '../../queries/queries.js'

const cuestGhq12 = {
    preguntas: [
        '1. ¿Ha podido concentrarse bien en lo que hace?\n    0) Mejor que lo habitual.\n    1) Igual que lo habitual.\n    2) Menos que lo habitual.\n    3) Mucho menos que lo habitual.',
        '2. ¿Sus preocupaciones le han hecho perder mucho el sueño?\n    0) No, en absoluto.\n    1) Igual que lo habitual.\n    2) Más que lo habitual.\n    3) Mucho más que lo habitual.',
        /*
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
        */
    ],
    umbrales: {
        bajo: {
            max: 11,
            mensaje: 'No hay presencia de síntomas significativos de malestar psicológico 🟢',
        },
        medio: { 
            min: 12, 
            max: 18, 
            mensaje: 'Hay cierto grado de preocupación emocional 🟡' 
        },
        alto: { 
            min: 19, 
            mensaje: 'Hay un indicador de malestar psicológico significativo 🔴' 
        },
    },
    resPreg: {
        0: [],
        1: [],
        2: [],
        3: [],
    },
}

export const procesarGHQ12 = async (numeroUsuario, respuestas) => {
    const tipoTest = 'ghq12'
    const { preguntas, umbrales } = cuestGhq12

    console.log('Procesando GHQ-12 para el usuario:', numeroUsuario)

    try {
        let estado = await getEstadoCuestionario(numeroUsuario, tipoTest)

        // Validar respuesta
        if (estado.resPreg && ![0,1,2,3].includes(Number(respuestas))) {
            return {
                error: 'Respuesta inválida. Debe ser un número entre 0 y 3.',
            }
        }

        // Iniciar estado si no existe
        if (!estado.resPreg) {
            estado = {
                Puntaje: 0,
                preguntaActual: 0,
                resPreg: { ...cuestGhq12.resPreg }, 
            }
            await saveEstadoCuestionario(
                numeroUsuario,
                estado.Puntaje,
                estado.preguntaActual,
                estado.resPreg,
                tipoTest
            )
            return preguntas[0]
        }

        const respuestaNum = Number(respuestas)
        estado.Puntaje += respuestaNum

        // Guardar respuesta
        if (!estado.resPreg[respuestaNum]) {
            estado.resPreg[respuestaNum] = []
        }
        estado.resPreg[respuestaNum].push(estado.preguntaActual + 1)

        // Verificar si hay más preguntas
        if (estado.preguntaActual < preguntas.length - 1) {
            
            // Guardar estado y puntaje 
            await saveEstadoCuestionario(
                numeroUsuario,
                estado.Puntaje,
                estado.preguntaActual + 1,
                estado.resPreg,
                tipoTest
            )
            await savePuntajeUsuario(numeroUsuario, estado.Puntaje, estado.resPreg, tipoTest)

            return evaluarGHQ12(estado.Puntaje, umbrales) + '\n\n' + preguntas[estado.preguntaActual + 1] // + '\n\n' + preguntas[estado.preguntaActual + 1] 
                                                                                                          // 👆 probando ( eliminar cualquier cosa )
        }

        // Siguiente pregunta
        estado.preguntaActual += 1 // ← probando ( sino funciona añadir = estado.preguntaActual = siguientePregunta )
        await saveEstadoCuestionario(
            numeroUsuario,
            estado.Puntaje,
            estado.preguntaActual,
            estado.resPreg,
            tipoTest
        )

        return preguntas[estado.preguntaActual]

    } catch (error) {
        console.error('Error al procesar GHQ-12:', error)
        return { error: 'Error interno del servidor.' }
    }
}

const evaluarGHQ12 = async (puntaje, umbrales) => {
	if (puntaje <= umbrales.bajo.max) {
		return `--* GHQ-12 COMPLETADO *--. 
        Su puntaje final es: ${puntaje} \n${umbrales.bajo.mensaje}`
	} else if (puntaje >= umbrales.medio.min && puntaje <= umbrales.medio.max) {
		return `--* GHQ-12 COMPLETADO *--. 
        Su puntaje final es: ${puntaje} \n${umbrales.medio.mensaje}`
	} else if (puntaje >= umbrales.alto.min) {
		return `--* GHQ-12 COMPLETADO *--. 
        Su puntaje final es: ${puntaje} \n${umbrales.alto.mensaje}`
	} else {
		return 'Error al evaluar su puntaje'
	}
}

export const GHQ12info = () => {
    return {
        nombre: 'GHQ-12',
        descripcion: 'Cuestionario de Salud General de 12 ítems',
        numPreguntas: cuestGhq12.preguntas.length,
        tiempoEstimado: '5-10 minutos',
    }
}



