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

import { practMenuFlow } from './roles/practMenuFlow.js'
// import { adminMenuFlow } from './roles/adminMenuFlow.js'

// NUEVO: resolver remitente
// import { resolverRemitentePorTelefono } from '../queries/queries.js'

//---------------------------------------------------------------------------------------------------------

// export const roleFlow = addKeyword(['menu', 'inicio', 'volver', '/start']).addAction(
//   async (ctx, { gotoFlow, state }) => {
//     try {
//       // 🔥 MEJORADO: Verificar más estados
//       const currentFlow = await state.get('currentFlow');
//       const currentMenu = await state.get('currentMenu');
//       const inTest = await state.get('testInProgress');
//       const inAgenda = await state.get('agendaInProgress');
      
//       // Si estamos en cualquier flujo activo, NO interrumpir
//       if (currentFlow || currentMenu || inTest || inAgenda) {
//         console.log('🚫 roleFlow: Usuario ya en flujo activo, no redirigiendo');
//         return;
//       }

//       // Solo verificar roles si realmente es un inicio limpio
//       const remitente = await resolverRemitentePorTelefono(ctx.from);
//       if (!remitente) return gotoFlow(registerFlow);

//       if (remitente.tipo === 'admin')       return gotoFlow(adminMenuFlow);
//       if (remitente.tipo === 'practicante') return gotoFlow(practMenuFlow);
//       if (remitente.tipo === 'usuario')     return gotoFlow(welcomeFlow);

//       return gotoFlow(registerFlow);
//     } catch (e) {
//       console.error('roleFlow error:', e);
//       return gotoFlow(registerFlow);
//     }
//   }
// );

//---------------------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { gotoFlow, state }) => {
    try {
      console.log('🟡 WELCOME ejecutándose para:', ctx.from);
      
      // 1. Verificar estado activo
      const currentFlow = await state.get('currentFlow');
      const currentMenu = await state.get('currentMenu');
      
      if (currentFlow || currentMenu) {
        console.log('🚫 Ya en flujo activo:', currentFlow, currentMenu);
        return;
      }

      // 2. Obtener usuario de BD
      const user = await obtenerUsuario(ctx.from);
      console.log('👤 Usuario obtenido:', {
        tipo: user?.tipo,
        flujo: user?.flujo,
        telefono: user?.data?.telefonoPersonal
      });
      
      if (!user) {
        console.log('❌ Error obteniendo usuario -> registerFlow');
        return gotoFlow(registerFlow);
      }
      
      await state.update({ user: user });

      // 3. Manejar por tipo de usuario
      if (user.tipo === 'practicante') {
        console.log('🔑 Practicante detectado -> practMenuFlow');
        await state.update({ currentFlow: 'practicante' });
        return gotoFlow(practMenuFlow);
      }

      // 4. Para usuarios normales, usar el flujo de la BD
      console.log('📋 Flujo BD:', user.flujo);
      
      switch (user.flujo) {
        case 'register':
          console.log('📝 -> registerFlow (usuario nuevo o incompleto)');
          return gotoFlow(registerFlow);
          
        case 'menuFlow':
          console.log('📋 -> menuFlow');
          await state.update({ currentFlow: 'menu' });
          return gotoFlow(menuFlow);
          
        case 'testFlow':
          console.log('📝 -> testFlow');
          await state.update({ currentFlow: 'test' });
          return gotoFlow(testFlow);
          
        case 'agendFlow':
          console.log('📅 -> agendFlow');
          await state.update({ currentFlow: 'agenda' });
          return gotoFlow(agendFlow);
          
        case 'testSelectionFlow':
          console.log('🎯 -> testSelectionFlow');
          await state.update({ currentFlow: 'testSelection' });
          return gotoFlow(testSelectionFlow);
          
        default:
          console.log('❓ Flujo desconocido:', user.flujo, '-> registerFlow');
          return gotoFlow(registerFlow);
      }
      
    } catch (e) {
      console.error('❌ welcomeFlow error:', e);
      return gotoFlow(registerFlow);
    }
  }
);

//---------------------------------------------------------------------------------------------------------

export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
  async (ctx, { flowDynamic, gotoFlow, state }) => {
    console.log('🔵 ctx.body:', ctx.body);
    const registerResponse = await apiRegister(ctx.from, ctx.body)
    await flowDynamic(registerResponse)
    
    // Si el registro fue exitoso, mostrar menú
    if (registerResponse.includes('Registrado')) {
	console.log('🔵 registerResponse:', registerResponse);
      // ✅ CLAVE: Marcar que estamos en el menú ANTES del gotoFlow
      await state.update({ 
        currentFlow: 'menu',
        user: { ...await state.get('user'), flujo: 'menuFlow' }
      });
      
      // Actualizar flujo del usuario en BD
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

// En menuFlow, al inicio:
export const menuFlow = addKeyword(utils.setEvent('MENU_FLOW'))
  .addAction(async (ctx, { state }) => {
    // Actualizar flujo solo cuando realmente llegamos al menú
    await switchFlujo(ctx.from, 'menuFlow')
    await state.update({ currentFlow: 'menu' })
    console.log('🟢 MENU_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    '¡Perfecto! Ahora puedes elegir qué hacer:\n\n' +
    '🔹 **1** - Realizar cuestionarios psicológicos\n' +
    '🔹 **2** - Agendar cita con profesional\n\n' +
    'Responde con **1** o **2**',
    { capture: true }, // ← IMPORTANTE: capture: true
    async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
      console.log('🟢 MENU_FLOW: Recibido mensaje:', ctx.body);
      console.log('🟢 MENU_FLOW: Usuario desde:', ctx.from);
      
      if (!ctx.body || ctx.body.trim() === '') {
        await flowDynamic('Por favor responde con 1 o 2');
        return fallBack();
      }

      const msg = validarRespuestaMenu(ctx.body, ['1', '2']);

      if (msg === '1') {
        // Hacer cuestionarios
        await flowDynamic(menuCuestionarios());
        await switchFlujo(ctx.from, 'testSelectionFlow')
        return gotoFlow(testSelectionFlow, { body: '' });
        
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
        return fallBack();
      }
    }
  );
//---------------------------------------------------------------------------------------------------------

export const testSelectionFlow = addKeyword(utils.setEvent('TEST_SELECTION_FLOW'))
  .addAction(async (ctx, { state }) => {
    await switchFlujo(ctx.from, 'testSelectionFlow');
    await state.update({ currentFlow: 'testSelection' });
    console.log('🟢 TEST_SELECTION_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    'Selecciona el cuestionario que deseas realizar:\n\n' +
    '🔹 **1** - GHQ-12 (Cuestionario de Salud General)\n' +
    '🔹 **2** - DASS-21 (Depresión, Ansiedad y Estrés)\n\n' +
    'Responde con **1** o **2**:',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const user = state.get('user') || {};
      const msg = ctx.body.trim();
      const tipoTest = parsearSeleccionTest(msg);

      if (!tipoTest) {
        await flowDynamic('❌ Por favor, responde con **1** para GHQ-12 o **2** para DASS-21');
        return fallBack();
      }

      const testName = tipoTest === 'ghq12' ? 'GHQ-12' : 'DASS-21';

      try {
        // Configura el test
        await changeTest(ctx.from, tipoTest);
        user.testActual = tipoTest;
        await state.update({ user });
        await switchFlujo(ctx.from, 'testFlow');

        // Solo mensaje de confirmación
        await flowDynamic(`✅ Iniciando cuestionario ${testName}...`);

        // NO envíes la primera pregunta aquí, deja que testFlow lo haga
        return gotoFlow(testFlow);
        
      } catch (error) {
        console.error('❌ Error en testSelectionFlow:', error);
        await flowDynamic('❌ Error. Regresando al menú...');
        return gotoFlow(menuFlow);
      }
    }
  );


//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { gotoFlow }) => {
		console.log('assistantFlow depreciado - redirigiendo a menuFlow')
		await switchFlujo(ctx.from, 'menuFlow')
		return gotoFlow(menuFlow)
	}
)

//---------------------------------------------------------------------------------------------------------

export const testFlow = addKeyword(utils.setEvent('TEST_FLOW'))
  .addAction(async (ctx, { flowDynamic, state }) => {
    // Solo inicialización - enviar primera pregunta
    const user = state.get('user');
    console.log('🟢 TESTFLOW: Iniciando test', user.testActual);
    
    try {
      // Obtener primera pregunta con procesarMensaje usando '_start'
      const firstQuestion = await procesarMensaje(ctx.from, '_start', user.testActual);
      
      if (firstQuestion && typeof firstQuestion === 'string' && firstQuestion.trim() !== '') {
        await flowDynamic(firstQuestion);
      } else {
        await flowDynamic('❌ Error iniciando el test.');
      }
    } catch (error) {
      console.error('❌ Error iniciando testFlow:', error);
      await flowDynamic('❌ Error iniciando el test.');
    }
  })
  .addAnswer(
    '', // Sin mensaje porque ya se envió en addAction
    { capture: true }, // ← CLAVE: Esto captura las respuestas del usuario
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const user = state.get('user');

      console.log('=== PROCESANDO RESPUESTA TESTFLOW ===');
      console.log('Mensaje del usuario:', ctx.body);
      console.log('Test actual:', user.testActual);

      try {
        // Procesar respuesta del usuario
        const message = await procesarMensaje(ctx.from, ctx.body, user.testActual);

        console.log('Mensaje a enviar:', message);
        
        if (!message || typeof message !== 'string' || message.trim() === '') {
          console.error('Error: procesarMensaje returned invalid value.', { message });
          await flowDynamic('❌ Error procesando respuesta. Intenta de nuevo.');
          return fallBack(); // Volver a pedir respuesta
        }
        
        await flowDynamic(message);

        // Verificar si el test se completó
        if (message.includes('COMPLETADO')) {
          // Limpiar test actual
          await changeTest(ctx.from, '');
          user.testActual = '';
          await state.update({ user });
          
          // Cambiar flujo a menú
          await switchFlujo(ctx.from, 'menuFlow');
          
          // Mostrar opciones post-test
          await flowDynamic(`🎉 ¡Excelente! Has completado el cuestionario.

¿Qué te gustaría hacer ahora?

🔹 **1** - Realizar otro cuestionario
🔹 **2** - Agendar cita con profesional
🔹 **3** - Finalizar por ahora

Responde con **1**, **2** o **3**`);
          
          return gotoFlow(postTestFlow);
        }

        // Si no se completó, mantener el flujo para la siguiente pregunta
        return fallBack(); // ← CLAVE: Esto mantiene el flujo activo

      } catch (error) {
        console.error('❌ Error en testFlow:', error);
        await flowDynamic('❌ Error procesando la prueba. Intenta nuevamente.');
        return fallBack();
      }
    }
  );

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


	//---------------------------------------------------------------------------------------------------------

	