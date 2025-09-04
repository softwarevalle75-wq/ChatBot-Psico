//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import {
	obtenerUsuario,
	changeTest,
	switchFlujo,
	switchAyudaPsicologica,
} from '../queries/queries.js'
import { apiRegister } from './register/aiRegister.js'
//import { procesarMensaje } from './tests/proccesTest.js'
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
      console.log('🟡 WELCOME ejecutándose para:', ctx.from, 'mensaje:', ctx.body);
      
      // 🔥 VERIFICAR SI HAY UN FLUJO ACTIVO CRÍTICO
      const currentFlow = await state.get('currentFlow');
      
      // 🚨 SI ESTAMOS EN TEST, REDIRIGIR AL TESTFLOW DIRECTAMENTE
      if (currentFlow === 'test') {
        console.log('🔀 Redirigiendo mensaje de test a testFlow');
        return gotoFlow(testFlow);
      }
      
      if (currentFlow === 'testSelection') {
        console.log('🚫 Selección de test activa, no interferir');
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

      // ✅ PERMITIR welcomeFlow durante el registro
      if (user.flujo === 'register') {
        console.log('📝 Usuario en registro, permitir welcomeFlow');
        await state.update({ user: user, currentFlow: 'register' });
        return gotoFlow(registerFlow);
      }

      // ✅ Verificar si ya está inicializado para flujos estables
      const isFirstMessage = !await state.get('initialized');
      if (!isFirstMessage && user.flujo === 'menuFlow' && currentFlow === 'menu') {
        console.log('🔄 Usuario ya inicializado en menú, no hacer nada');
        return;
      }

      await state.update({ initialized: true, user: user });

      // 3. Manejar por tipo de usuario
      if (user.tipo === 'practicante') {
        console.log('🔑 Practicante detectado -> practMenuFlow');
        await state.update({ currentFlow: 'practicante' });
        return gotoFlow(practMenuFlow);
      }

      // 4. Para usuarios normales, usar el flujo de la BD
      console.log('📋 Flujo BD:', user.flujo);
      
      switch (user.flujo) {
        case 'consentimiento_rechazado':
          console.log('❌ Usuario rechazó consentimiento -> reconsentFlow');
          return gotoFlow(reconsentFlow);
          
        case 'menuFlow':
          console.log('📋 -> menuFlow');
          await state.update({ currentFlow: 'menu' });
          return gotoFlow(menuFlow);
          
        case 'testFlow':
          // 🔥 SOLO SI NO ESTAMOS YA EN TEST
          if (currentFlow !== 'test') {
            console.log('📝 -> testFlow (desde welcomeFlow)');
            await state.update({ 
              currentFlow: 'test',
              justInitializedTest: true,
              user: user,
              testAsignadoPorPracticante: true // 🔥 BANDERA PARA DISTINGUIR ORIGEN
            });
            return gotoFlow(testFlow);
          } else {
            console.log('🔄 Ya estamos en testFlow, no redirigir');
            return;
          }
          
        case 'agendFlow':
          console.log('📅 -> agendFlow');
          await state.update({ currentFlow: 'agenda' });
          return gotoFlow(agendFlow);
          
        case 'testSelectionFlow':
          // 🔥 SOLO SI NO ESTAMOS YA EN SELECCIÓN
          if (currentFlow !== 'testSelection') {
            console.log('🎯 -> testSelectionFlow');
            await state.update({ currentFlow: 'testSelection' });
            return gotoFlow(testSelectionFlow);
          } else {
            console.log('🔄 Ya estamos en testSelectionFlow, no redirigir');
            return;
          }

          
        default:
          console.log('❓ Flujo por defecto -> menuFlow');
          await switchFlujo(ctx.from, 'menuFlow');
          await state.update({ currentFlow: 'menu' });
          return gotoFlow(menuFlow);
      }
      
    } catch (e) {
      console.error('❌ welcomeFlow error:', e);
      return gotoFlow(registerFlow);
    }
  }
);

// ========================================
// TESTFLOW CORREGIDO - CON KEYWORD ESPECÍFICO
// ========================================

export const testFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    // 🔥 CONFIGURACIÓN INICIAL DEL TEST
    let user = state.get('user');
    const justInitialized = state.get('justInitializedTest');
    const testActualFromState = state.get('testActual');
    const currentFlow = state.get('currentFlow');
    
    console.log('🔥 TESTFLOW INIT - Current flow:', currentFlow);
    console.log('🔥 TESTFLOW INIT - Just initialized:', justInitialized);

    if (currentFlow !== 'test') {
      console.log('🚫 testFlow ejecutado fuera de contexto');
      return;
    }

    // Obtener test actual
    let testActual = user?.testActual || testActualFromState;
    if (!testActual) {
      const userFromDB = await obtenerUsuario(ctx.from);
      testActual = userFromDB?.testActual;
    }

    if (!testActual) {
      console.log('❌ No hay test seleccionado');
      await flowDynamic('❌ No hay un test seleccionado. Volviendo al menú.');
      await state.update({ currentFlow: 'menu', justInitializedTest: false });
      await switchFlujo(ctx.from, 'menuFlow');
      return gotoFlow(menuFlow);
    }

    // Actualizar estado
    if (!user?.testActual) {
      user = user || {};
      user.testActual = testActual;
      await state.update({ user: user });
    }

    // 🔥 ENVIAR PRIMERA PREGUNTA SOLO SI ES NECESARIO
    if (justInitialized) {
      console.log('🚀 Enviando primera pregunta del test');
      await state.update({ justInitializedTest: false });
      
      let primeraPregunta;
      if (testActual === 'dass21') {
        primeraPregunta = await procesarDass21(ctx.from, null);
      } else if (testActual === 'ghq12') {
        primeraPregunta = await procesarGHQ12(ctx.from, null);
      }
      
      if (primeraPregunta?.trim()) {
        console.log('📤 Primera pregunta enviada');
        await flowDynamic(primeraPregunta);
        
        // 🔥 CONFIGURAR LISTENER PARA CUALQUIER MENSAJE
        await state.update({ waitingForTestResponse: true });
      }
      return;
    }

    // 🔥 PROCESAR RESPUESTAS SI LLEGAMOS AQUÍ DIRECTAMENTE
    const waitingForResponse = await state.get('waitingForTestResponse');
    if (waitingForResponse) {
      console.log('🔄 Procesando respuesta directa:', ctx.body);
      await procesarRespuestaTest(ctx, { flowDynamic, gotoFlow, state });
    }
  });

// ========================================
// TESTFLOW CON CAPTURA UNIVERSAL
// ========================================

export const testResponseFlow = addKeyword(['0', '1', '2', '3'])
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    const currentFlow = await state.get('currentFlow');
    const waitingForResponse = await state.get('waitingForTestResponse');
    
    console.log('🔥 TESTRESPONSE - Flow:', currentFlow, 'Waiting:', waitingForResponse);
    
    if (currentFlow === 'test' && waitingForResponse) {
      console.log('🔄 Procesando respuesta de test:', ctx.body);
      await procesarRespuestaTest(ctx, { flowDynamic, gotoFlow, state });
    }
  });

// ========================================
// FUNCIÓN HELPER PARA PROCESAR RESPUESTAS
// ========================================

async function procesarRespuestaTest(ctx, { flowDynamic, gotoFlow, state }) {
  const user = state.get('user');
  const testActual = user?.testActual || state.get('testActual');
  
  if (!testActual) {
    console.log('❌ No hay test en curso');
    await flowDynamic('❌ Error: no hay test activo.');
    await state.update({ currentFlow: 'menu', waitingForTestResponse: false });
    return gotoFlow(menuFlow);
  }

  try {
    console.log('🔄 Procesando respuesta:', ctx.body, 'para test:', testActual);
    
    let message;
    if (testActual === 'dass21') {
      message = await procesarDass21(ctx.from, ctx.body);
    } else if (testActual === 'ghq12') {
      message = await procesarGHQ12(ctx.from, ctx.body);
    }

    if (!message?.trim()) {
      console.error('❌ Respuesta inválida del procesador');
      await flowDynamic('❌ Error procesando respuesta. Intenta de nuevo.');
      return;
    }
    
    console.log('📤 Enviando:', message.substring(0, 50) + '...');
    await flowDynamic(message);

    // ✅ Verificar si terminó
    if (message.includes('completada') || 
        message.includes('terminada') || 
        message.includes('finalizada') ||
        message.includes('Puntaje total') ||
        message.includes('🎉')) {
      
      console.log('🎉 Test completado');
      
      // Verificar si fue asignado por practicante
      const testAsignadoPorPracticante = await state.get('testAsignadoPorPracticante');
      
      if (testAsignadoPorPracticante) {
        console.log('🔥 Test asignado por practicante - NO ir a menuFlow');
        // Limpiar estado sin redirigir a menú
        user.testActual = null;
        await state.update({ 
          user: user, 
          currentFlow: null,
          justInitializedTest: false,
          testActual: null,
          waitingForTestResponse: false,
          testAsignadoPorPracticante: false
        });
        await switchFlujo(ctx.from, 'menuFlow'); // Solo actualizar BD        
        return; // NO hacer gotoFlow
      } else {
        console.log('🎉 Test seleccionado por usuario - ir a menuFlow');
        // Limpiar estado y redirigir a menú
        user.testActual = null;
        await state.update({ 
          user: user, 
          currentFlow: 'menu',
          justInitializedTest: false,
          testActual: null,
          waitingForTestResponse: false
        });
        await switchFlujo(ctx.from, 'menuFlow');
        
        setTimeout(() => {
          gotoFlow(menuFlow);
        }, 1000);
      }
    }
    // Si no terminó, seguimos esperando más respuestas

  } catch (error) {
    console.error('❌ Error procesando respuesta:', error);
    await flowDynamic('❌ Error procesando respuesta. Intenta de nuevo.');
  }
}

export const testSelectionFlow = addKeyword(utils.setEvent('TEST_SELECTION_FLOW'))
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'testSelection' });
    console.log('🟢 TEST_SELECTION_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    // 'Selecciona el cuestionario que deseas realizar:\n\n' +
    // '🔹 **1** - GHQ-12 (Cuestionario de Salud General)\n' +
    // '🔹 **2** - DASS-21 (Depresión, Ansiedad y Estrés)\n\n' +
    // 'Responde con **1** o **2**:',
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
        console.log('🔧 Configurando test:', tipoTest);
        
        // Configurar test en BD
        await changeTest(ctx.from, tipoTest);
        
        // Actualizar estados
        user.testActual = tipoTest;
        await state.update({ 
          user: user,
          currentFlow: 'test',
          testActual: tipoTest,
          justInitializedTest: true // 🔥 BANDERA CRÍTICA
        });
        
        // Cambiar flujo en BD
        await switchFlujo(ctx.from, 'testFlow');

        await flowDynamic(`✅ Iniciando cuestionario ${testName}...`);
        console.log('🚀 Redirigiendo a testFlow con bandera activa');
        
        return gotoFlow(testFlow);
        
      } catch (error) {
        console.error('❌ Error en testSelectionFlow:', error);
        await flowDynamic('❌ Error. Regresando al menú...');
        await state.update({ currentFlow: 'menu' });
        return gotoFlow(menuFlow);
      }
    }
  );

//---------------------------------------------------------------------------------------------------------

export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
  async (ctx, { flowDynamic, gotoFlow, state }) => {
    console.log('🔵 ctx.body:', ctx.body);
    const registerResponse = await apiRegister(ctx.from, ctx.body)
    await flowDynamic(registerResponse)
    
    // Si el registro fue exitoso, ir al flujo de tratamiento de datos
    if (registerResponse.includes('Registrado')) {
	console.log('🔵 registerResponse:', registerResponse);
      
      // Actualizar estado para tratamiento de datos
      await state.update({ 
        currentFlow: 'dataConsent',
        user: { ...await state.get('user'), flujo: 'dataConsentFlow' }
      });
      
      return gotoFlow(dataConsentFlow)
    }
  }
)
//---------------------------------------------------------------------------------------------------------

// Flujo de consentimiento de tratamiento de datos
export const dataConsentFlow = addKeyword(utils.setEvent('DATA_CONSENT_FLOW'))
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'dataConsent' });
    console.log('🔒 DATA_CONSENT_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    '📋 **TRATAMIENTO DE DATOS PERSONALES**\n\n' +
    'Para continuar con nuestros servicios, necesitamos tu consentimiento para el tratamiento de tus datos personales según la Ley de Protección de Datos.\n\n' +
    '🔹 Tus datos serán utilizados únicamente para brindar servicios psicológicos\n' +
    '🔹 No compartiremos tu información con terceros\n' +
    '🔹 Puedes solicitar la eliminación de tus datos en cualquier momento\n\n' +
    '¿Aceptas el tratamiento de tus datos personales?\n\n' +
    'Responde **"si"** para aceptar o **"no"** para rechazar:',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, endFlow }) => {
      const respuesta = ctx.body.trim().toLowerCase();
      
      if (respuesta === 'si') {
        // Usuario acepta el tratamiento de datos
        await state.update({ 
          currentFlow: 'menu',
          user: { ...await state.get('user'), flujo: 'menuFlow' }
        });
        
        // Actualizar flujo del usuario en BD
        await switchFlujo(ctx.from, 'menuFlow');
        
        await flowDynamic('✅ **Consentimiento aceptado**\n\nGracias por aceptar el tratamiento de datos. Ahora puedes acceder a todos nuestros servicios.');
        
        return gotoFlow(menuFlow);
        
      } else if (respuesta === 'no') {
        // Usuario rechaza el tratamiento de datos
        // Marcar en BD que rechazó el consentimiento
        await switchFlujo(ctx.from, 'consentimiento_rechazado');
        
        await flowDynamic('❌ **Lo sentimos, pero no puedes continuar si no aceptas el tratamiento de datos.**\n\nSi cambias de opinión, puedes escribirnos nuevamente en cualquier momento.\n\n¡Que tengas un buen día! 👋');
        
        return endFlow();
        
      } else {
        // Respuesta inválida
        await flowDynamic('❌ Por favor responde únicamente **"si"** para aceptar o **"no"** para rechazar el tratamiento de datos.');
        return gotoFlow(dataConsentFlow);
      }
    }
)
//---------------------------------------------------------------------------------------------------------

// Flujo para usuarios que rechazaron consentimiento y quieren reconsiderar
export const reconsentFlow = addKeyword(utils.setEvent('RECONSENT_FLOW'))
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'reconsent' });
    console.log('🔄 RECONSENT_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    '❌ **No puedes acceder al sistema porque rechazaste el tratamiento de datos.**\n\n' +
    'Si has cambiado de opinión y deseas aceptar el tratamiento de datos, escribe **"acepto"** para continuar.',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, endFlow }) => {
      const respuesta = ctx.body.trim().toLowerCase();
      
      if (respuesta === 'acepto') {
        // Usuario acepta ahora
        await state.update({ 
          currentFlow: 'menu',
          user: { ...await state.get('user'), flujo: 'menuFlow' }
        });
        
        await switchFlujo(ctx.from, 'menuFlow');
        
        await flowDynamic('✅ **Consentimiento aceptado**\n\nGracias por aceptar el tratamiento de datos. Ahora puedes acceder a todos nuestros servicios.');
        
        return gotoFlow(menuFlow);
        
      } else {
        // Cualquier otra respuesta = rechaza de nuevo
        await flowDynamic('❌ **Debes escribir "acepto" para continuar.**\n\nSi no deseas aceptar el tratamiento de datos, no podrás usar nuestros servicios.\n\n¡Que tengas un buen día! 👋');
        
        return endFlow();
      }
    }
  );

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

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { gotoFlow }) => {
		console.log('assistantFlow depreciado - redirigiendo a menuFlow')
		await switchFlujo(ctx.from, 'menuFlow')
		return gotoFlow(menuFlow)
	}
)


// --------------------------------------------------------------------------------------------------

export const postTestFlow = addKeyword(utils.setEvent('POST_TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow }) => {
		const msg = ctx.body.trim()

		if (msg === '1') {
			// Hacer otro cuestionario
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

	