//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import {
	obtenerUsuario,
	changeTest,
	switchFlujo,
	switchAyudaPsicologica,
} from '../queries/queries.js'
import { apiRegister } from './register/aiRegister.js'
import { procesarMensaje } from './tests/proccesTest.js'
import { menuCuestionarios, parsearSeleccionTest} from './tests/controlTest.js'
import { apiAgend } from './agend/aiAgend.js'
import { procesarDass21 } from './tests/dass21.js'
import { procesarGHQ12 } from './tests/ghq12.js'

//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
	async (ctx, { gotoFlow, state }) => {
		const user = await obtenerUsuario(ctx.from)

		await state.update({ user: user })
		console.log(user.flujo)
		
		switch (user.flujo) {
			case 'menuFlow':
				console.log('Dirigiendo a menuFlow')
				return gotoFlow(menuFlow)
			case 'testFlow':
				console.log('Dirigiendo a testFlow')
				return gotoFlow(testFlow)
			case 'agendFlow':
				console.log('Dirigiendo a agendFlow')
				return gotoFlow(agendFlow)
			case 'testSelectionFlow':
				console.log('Dirigiendo a testSelectionFlow')
				return gotoFlow(testSelectionFlow)
			default:
				console.log('Dirigiendo a registerFlow')
				return gotoFlow(registerFlow)
		}

		
	}
)

//---------------------------------------------------------------------------------------------------------

export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow }) => {
		
		const registerResponse = await apiRegister(ctx.from, ctx.body)
		await flowDynamic(registerResponse)
		
		// Si el registro fue exitoso, mostrar menú
		if (registerResponse.includes('Registrado')) {
			// Actualizar flujo del usuario
			await switchFlujo(ctx.from, 'menuFlow')
			
			// Mostrar menú principal
			await flowDynamic(`¡Perfecto! Ahora puedes elegir qué hacer:

🔹 **1** - Realizar cuestionarios psicológicos
🔹 **2** - Agendar cita con profesional

Responde con **1** o **2**`)
			
			return gotoFlow(menuFlow, { body: '' })
		}
	}
)
//---------------------------------------------------------------------------------------------------------

const validarRespuestaMenu = (respuesta, opcionesValidas) => {
    const resp = respuesta?.toString().trim();
    return opcionesValidas.includes(resp) ? resp : null;
};

export const menuFlow = addKeyword(utils.setEvent('MENU_FLOW'))
  .addAnswer('¡Perfecto! Ahora puedes elegir qué hacer: 🔹 **1** - Realizar cuestionarios psicológicos 🔹 **2** - Agendar cita con profesional')
  .addAction(async (ctx, { flowDynamic, gotoFlow }) => {

	if (!ctx.body || ctx.body.trim() === '') return

    const msg = validarRespuestaMenu(ctx.body, ['1', '2']);


        if (msg === '1') {
            // Hacer cuestionarios
            await flowDynamic(menuCuestionarios());

			await switchFlujo(ctx.from, 'testSelectionFlow')
            return gotoFlow(testSelectionFlow, {body: '' });
        } else if (msg === '2') {
            // Agendar cita
            await switchFlujo(ctx.from, 'agendFlow');
            await flowDynamic('Te ayudaré a agendar tu cita. Por favor, dime qué día te gustaría agendar.');
            return gotoFlow(agendFlow);
        } else {
            // Opción inválida
            await flowDynamic(`❌ Opción no válida. Por favor responde:

🔹 **1** - Para realizar cuestionarios
🔹 **2** - Para agendar cita`);
        }
    }
)

//---------------------------------------------------------------------------------------------------------

export const testSelectionFlow = addKeyword(utils.setEvent('TEST_SELECTION_FLOW')).addAction(
  async (ctx, { flowDynamic, gotoFlow, state }) => {
    const user = state.get('user');
    const msg = ctx.body.trim();

    const tipoTest = parsearSeleccionTest(msg);

    if (!tipoTest) {
      await flowDynamic('Por favor, responde con **1** para GHQ-12 o **2** para DASS-21');
      return;
    }

    const testName = tipoTest === 'ghq12' ? 'GHQ-12' : 'DASS-21';

    // Actualizar test actual
    await changeTest(ctx.from, tipoTest);
    user.testActual = tipoTest;
    await state.update({ user });
    await switchFlujo(ctx.from, 'testFlow');

    await flowDynamic(`Perfecto, empecemos con el cuestionario ${testName}`);
    
	if (tipoTest === 'dass21') {
      const primeraPregunta = await procesarDass21(ctx.from, null);
      
      if (typeof primeraPregunta === 'string' && primeraPregunta.trim() !== '') {
        await flowDynamic(primeraPregunta);
      } else {
        await flowDynamic('Ocurrió un error iniciando el test. Intenta nuevamente.');
        return gotoFlow(menuFlow);
      }
    } else if (tipoTest === 'ghq12') {
      const primeraPregunta = await procesarGHQ12(ctx.from, null);
      
      if (typeof primeraPregunta === 'string' && primeraPregunta.trim() !== '') {
        await flowDynamic(primeraPregunta);
      } else {
        await flowDynamic('Ocurrió un error iniciando el test. Intenta nuevamente.');
        return gotoFlow(menuFlow);
      }
    }

    return gotoFlow(testFlow, {body: ''});
  }
)


//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { gotoFlow }) => {
		console.log('assistantFlow depreciado - redirigiendo a menuFlow')
		await switchFlujo(ctx.from, 'menuFlow')
		return gotoFlow(menuFlow)
	}
)

//---------------------------------------------------------------------------------------------------------

export const testFlow = addKeyword(utils.setEvent('TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		let user = state.get('user')

		console.log('=== INICIO TESTFLOW ===')
		console.log('Mensaje del usuario:', ctx.body)
		console.log('Test actual:', user.testActual)

		try {
			// Procesar mensaje del usuario
			const message = await procesarMensaje(ctx.from, ctx.body, user.testActual)
	
			console.log('Mensaje a enviar:', message)
			
			if (!message || typeof message !== 'string' || message.trim() === '') {
                console.error('Error: procesarMensaje returned an invalid value.', { message });
                await flowDynamic('Ocurrió un error procesando el mensaje. Por favor, inténtelo de nuevo.');
                return;
            }
			
			await flowDynamic(message)

			// Verificar si el test se completó
			if (message.includes('COMPLETADO')) {
				// Limpiar test actual
				await changeTest(ctx.from, '')
				user.testActual = ''
				await state.update({ user })
				
				// Cambiar flujo a menú
				await switchFlujo(ctx.from, 'menuFlow')
				
				// Mostrar opciones post-test
				await flowDynamic(`¡Excelente! Has completado el cuestionario.

¿Qué te gustaría hacer ahora?

🔹 **1** - Realizar otro cuestionario
🔹 **2** - Agendar cita con profesional
🔹 **3** - Finalizar por ahora

Responde con **1**, **2** o **3**`)
				
				return gotoFlow(postTestFlow, { body: '' })
			}

		} catch (error) {
			console.error('Error en testFlow:', error)
			await flowDynamic('Ocurrió un error al procesar la prueba. Por favor intenta nuevamente.')
		}
	}
)

// --------

export const postTestFlow = addKeyword(utils.setEvent('POST_TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow }) => {
		const msg = ctx.body.trim()

		if (msg === '1') {
			// Hacer otro cuestionario
			await flowDynamic(menuCuestionarios())
			return gotoFlow(testSelectionFlow, { body: '' })
		} else if (msg === '2') {
			// Agendar cita
			await switchFlujo(ctx.from, 'agendFlow')
			await flowDynamic('Te ayudaré a agendar tu cita. Por favor, dime qué día te gustaría agendar.')
			return gotoFlow(agendFlow, { body: '' })
		} else if (msg === '3') {
			// Finalizar
			await switchFlujo(ctx.from, 'menuFlow')
			await flowDynamic('¡Gracias por usar nuestros servicios! Puedes regresar cuando gustes escribiendo cualquier mensaje.')
			return gotoFlow(menuFlow, { body: '' })
		} else {
			// Opción inválida
			await flowDynamic(`Por favor responde:

🔹 **1** - Realizar otro cuestionario
🔹 **2** - Agendar cita
🔹 **3** - Finalizar`)
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const agendFlow = addKeyword(utils.setEvent('AGEND_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')

		try {
			const msgAgend = await apiAgend(ctx.from, ctx.body, user)

			if (msgAgend.includes('Se ha registrado su cita para el día')) {
				await switchAyudaPsicologica(ctx.from, 0)
				user.ayudaPsicologica = 0
				await state.update({ user: user })
				await switchFlujo(ctx.from, 'menuFlow')

				await flowDynamic(msgAgend)
				await flowDynamic(`¡Cita agendada exitosamente!

¿Qué te gustaría hacer ahora?

🔹 **1** - Realizar cuestionarios psicológicos
🔹 **2** - Finalizar por ahora

Responde con **1** o **2**`)
				
				return gotoFlow(postAgendFlow)
			} else {
				await flowDynamic(msgAgend)
			}
		} catch (error) {
			console.error('Error en agendFlow:', error)
			await flowDynamic('Ocurrió un error al procesar la agenda. Intenta nuevamente.')
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const postAgendFlow = addKeyword(utils.setEvent('POST_AGEND_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow }) => {
		const msg = ctx.body.trim()

		if (msg === '1') {
			// Hacer cuestionarios
			await flowDynamic(menuCuestionarios())
			return gotoFlow(testSelectionFlow)
		} else if (msg === '2') {
			// Finalizar
			await switchFlujo(ctx.from, 'menuFlow')
			await flowDynamic('¡Gracias por usar nuestros servicios! Puedes regresar cuando gustes.')
			return gotoFlow(menuFlow)
		} else {
			await flowDynamic(`Por favor responde:

🔹 **1** - Realizar cuestionarios
🔹 **2** - Finalizar`)
		}
	}
)