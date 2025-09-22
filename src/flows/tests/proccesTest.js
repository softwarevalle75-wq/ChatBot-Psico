/*  ------------------------ processMensaje.js ------------------------
	Este archivo se encarga de manejar la logica del flujo de mensajes
	para el tratamiento de datos y cuestionarios de la aplicacion
	Aca se hacen varias validaciones para llevar al usuario al 
	Cuestionario correspondiente.
	--------------------------------------------------------------------
*/
import axios from 'axios'
import { procesarCuestionario } from './controlTest.js'

const estadoUsuarios = new Map()

const mensajesTest = {
    ghq12: 'A continuación, te presentaremos el cuestionario GHQ-12. Es una forma sencilla de conocer un poco mejor cómo te has sentido en las últimas dos semanas. Tus respuestas son muy valiosas para nosotros y, por supuesto, serán tratadas con total confidencialidad.',
    dass21: 'El Cuestionario DASS-21 es una herramienta que nos permitirá evaluar tus niveles de depresión, ansiedad y estrés. Tus respuestas son confidenciales y nos ayudarán a entenderte mejor.',    
}

// Marcar test como visto
function marcarTestVisto(numeroUsuario, tipoTest) {
    if (!estadoUsuarios.has(numeroUsuario)) {
        estadoUsuarios.set(numeroUsuario, { ghq12: true, dass21: true })
    }
    const estadoUsuario = estadoUsuarios.get(numeroUsuario)
    estadoUsuario[tipoTest] = false
    estadoUsuarios.set(numeroUsuario, estadoUsuario)
}


// Procesar el mensaje del usuario
export async function procesarMensaje(numeroUsuario, mensaje, tipoTest) {
  tipoTest = tipoTest.toLowerCase()
  if (!tipoTest) {
    console.error('❌ tipoTest es undefined en procesarMensaje');
    return 'Error: No se ha seleccionado un tipo de test válido.';
  }

  tipoTest = tipoTest.toLowerCase(); // ← Línea 40 que está fallando

  try {
    // Si el mensaje es '_start', iniciamos el test desde cero
    if (mensaje === '_start') {
      await marcarTestVisto(numeroUsuario, tipoTest);

      await axios.post('http://localhost:3000/v1/messages', {
        number: numeroUsuario,
        message: mensajesTest[tipoTest],
      });

      const primeraPregunta = await procesarCuestionario(numeroUsuario, tipoTest, null);
      return primeraPregunta;
    }

    // Validar que el mensaje no esté vacío
    if (!mensaje || mensaje.trim() === '') {
      return 'Por favor responde con una opción válida.';
    }

    // Procesar respuesta del usuario
    console.log('Procesando respuesta del usuario:', mensaje);
    const resultado = await procesarCuestionario(numeroUsuario, tipoTest, mensaje);
    return resultado;

  } catch (error) {
    console.error('Error procesando el test:', error);
    return 'Ocurrió un error al procesar la prueba. Intenta nuevamente';
  }
}


// Resetear estado de usuario
export function resetEstadoUsuario(numeroUsuario) {
    if (estadoUsuarios.has(numeroUsuario)) {
        estadoUsuarios.delete(numeroUsuario)
        console.log(`Se reseteó el estado del usuario: ${numeroUsuario}`)
    }
}

// Resetear test de usuario
export function resetTestUsuario(numeroUsuario, tipoTest) {
    if (estadoUsuarios.has(numeroUsuario)) {
        const estadoUsuario = estadoUsuarios.get(numeroUsuario)
        estadoUsuario[tipoTest] = true
        estadoUsuarios.set(numeroUsuario, estadoUsuario)
        console.log(`Test ${tipoTest} reseteado para usuario: ${numeroUsuario}`)
    }
}
