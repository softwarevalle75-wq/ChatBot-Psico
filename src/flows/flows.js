//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import {
	obtenerUsuario,
	changeTest,
  resetearEstadoPrueba,
	switchFlujo,
	//switchAyudaPsicologica,
	guardarPracticanteAsignado,
} from '../queries/queries.js'
//import { apiRegister } from './register/aiRegister.js'
import { menuCuestionarios, parsearSeleccionTest} from './tests/controlTest.js'
//import { apiAgend } from './agend/aiAgend.js'
import { procesarDass21 } from './tests/dass21.js'
import { procesarGHQ12 } from './tests/ghq12.js'
// Importar el helper al inicio del archivo
import { verificarAutenticacionWeb } from '../helpers/auntenticarUsuario.js';
import { practMenuFlow, practEsperarResultados } from './roles/practMenuFlow.js'
import { 
  buscarPracticanteDisponible, 
  guardarCita, 
  formatearMensajeCita,
  formatearHorariosDisponibles 
} from '../helpers/agendHelpers.js';
//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { gotoFlow, flowDynamic, state }) => {
    try {
      console.log('🟡 WELCOME ejecutándose para:', ctx.from, 'mensaje:', ctx.body);
      
      // 1. VERIFICAR FLUJOS ACTIVOS CRÍTICOS (prioridad máxima)
      const currentFlow = await state.get('currentFlow');
      
      if (currentFlow === 'test') {
        console.log('🔀 Redirigiendo mensaje de test a testFlow');
        return gotoFlow(testFlow);
      }
      if (currentFlow === 'testSelection') {
        console.log('🔀 Redirigiendo mensaje a testSelectionFlow');
        return gotoFlow(testSelectionFlow);
      }
      if (currentFlow === 'menu') {
        console.log('🚫 Usuario ya en menú, no interferir con welcomeFlow');
        return;
      }
      // 2. VERIFICAR AUTENTICACIÓN WEB PRIMERO (SIEMPRE)
      const authUser = await verificarAutenticacionWeb(ctx.from, flowDynamic);
      if (!authUser) return; // Si no está autenticado, parar aquí
      
      // 3. CREAR OBJETO USER CON DATOS AUTENTICADOS
      const usuarioAutenticado = {
        tipo: 'usuario',
        data: authUser,
        flujo: authUser.flujo || 'menuFlow'
      };
      console.log('👤 Usuario autenticado:', usuarioAutenticado);

      // 4. ACTUALIZAR ESTADO CON USUARIO
      await state.update({ initialized: true, user: usuarioAutenticado });
      // 5. MANEJAR POR TIPO DE USUARIO (practicantes tienen lógica especial)
      if (usuarioAutenticado.tipo === 'practicante') {
        return await handlePracticanteFlow(ctx, usuarioAutenticado, state, gotoFlow, flowDynamic);
      }

      // 6. MANEJAR USUARIOS NORMALES - SIEMPRE AL MENÚ (ya están autenticados)
      console.log('✅ Usuario autenticado -> menuFlow');
      // Resetear flujo a menuFlow para evitar redirecciones automáticas
      await switchFlujo(ctx.from, 'menuFlow');
      await state.update({ currentFlow: 'menu' });
      return gotoFlow(menuFlow);
      
    } catch (e) {
      console.error('❌ welcomeFlow error:', e);
      return gotoFlow(menuFlow);
    }
  }
);

// Función auxiliar para manejar flujo de practicantes
async function handlePracticanteFlow(ctx, user, state, gotoFlow) {
  const esperandoResultados = await state.get('esperandoResultados');
  const currentFlow = await state.get('currentFlow');

  if (esperandoResultados || currentFlow === 'esperandoResultados') {
    console.log('⏳ Practicante esperando resultados...');
    return gotoFlow(practEsperarResultados);
  }

  console.log('🔑 Practicante detectado -> practMenuFlow');
  await state.update({ currentFlow: 'practicante' });
  return gotoFlow(practMenuFlow);
}

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
      await switchFlujo(ctx.from, 'menuFlow'); // DESCOMENTADO - ahora funciona
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


export const procesarRespuestaTest = async (ctx, { flowDynamic, gotoFlow, state, provider }) => {
  const user = state.get('user');
  const testActual = user?.testActual || state.get('testActual');
  
  if (!testActual) {
    console.log('❌ No hay test en curso');
    await flowDynamic('❌ Error: no hay test activo.');
    await state.update({ currentFlow: 'menu', waitingForTestResponse: false });
    return gotoFlow(menuFlow);
  }

  let resultado;
  if (testActual === 'ghq12') {
    resultado = await procesarGHQ12(ctx.from, ctx.body, provider)
  } else if (testActual === 'dass21') {
    resultado = await procesarDass21(ctx.from, ctx.body, provider)
  }

  if (resultado?.error) {
    await flowDynamic(resultado.error);
    return;
  }

  if (typeof resultado === 'string') {
    await flowDynamic(resultado);

    if(resultado.includes('completada')) {
      console.log('🎉 Test completado, limpiando estado');
      await state.update({
        user: user,
        currentFlow: 'menu',
        justInitializedTest: false,
        testActual: null,
        waitingForTestResponse: false
      });
      await switchFlujo(ctx.from, 'menuFlow'); // DESCOMENTADO - ahora funciona
      return gotoFlow(menuFlow);
    }
  }
}

//--------------------------------------------------------------------------------

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

        // Resetear estado prueba
        await resetearEstadoPrueba(ctx.from, tipoTest)
        
        // Configurar test en BD
        await changeTest(ctx.from, tipoTest);
        
        // Actualizar estados
        user.testActual = tipoTest;
        await state.update({ 
          user: user,
          currentFlow: 'test',
          testActual: tipoTest,
          justInitializedTest: true 
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

// export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
//   async (ctx, { flowDynamic, gotoFlow, state }) => {
//     console.log('🔵 ctx.body:', ctx.body);
//     const registerResponse = await apiRegister(ctx.from, ctx.body)
//     await flowDynamic(registerResponse)
    
//     // Si el registro fue exitoso, ir al flujo de tratamiento de datos
//     if (registerResponse.includes('Registrado')) {
// 	console.log('🔵 registerResponse:', registerResponse);
      
//       // Actualizar estado para tratamiento de datos
//       await state.update({ 
//         currentFlow: 'dataConsent',
//         user: { ...await state.get('user'), flujo: 'dataConsentFlow' }
//       });
      
//       return gotoFlow(dataConsentFlow)
//     }
//   }
// )

//---------------------------------------------------------------------------------------------------------

export const pedirNumeroPracticanteAsignadoFlow = addKeyword(utils.setEvent('PEDIR_NUMERO_PRACTICANTE_ASIGNADO'))
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'pedirNumeroPracticanteAsignado' });
    console.log('🟢 PEDIR_NUMERO_PRACTICANTE_ASIGNADO: Inicializado para:', ctx.from);
  })
  .addAnswer(
    'Por favor, proporciona el número de tu *psicologo asignado* \n\nSi *no tienes el número*, puedes solicitarlo a tu psicologo.',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const numeroPracticanteAsignado = (ctx.body || '').replace(/\D/g, '');  
      
      console.log('🔵 numeroPracticanteAsignado:', numeroPracticanteAsignado);
      
      if (numeroPracticanteAsignado.length < 8){
        await flowDynamic('El número debe tener al menos *8 dígitos*.');
        return fallBack();
      } 
      
      try {
        // Guardar el número del practicante asignado
        await guardarPracticanteAsignado(ctx.from, numeroPracticanteAsignado);
        
        await flowDynamic('✅ Número de practicante asignado guardado correctamente.');
        
        await switchFlujo(ctx.from, 'menuFlow');
        await state.update({ 
          currentFlow: 'menu',
          user: { ...await state.get('user'), flujo: 'menuFlow' }
        });
        return gotoFlow(menuFlow);
      } catch (error) {
        console.error('Error guardando practicante:', error);
        await flowDynamic('❌ Error guardando el número. Intenta de nuevo.');
        return fallBack();
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
          currentFlow: 'numeroPracticanteAsignado',
          user: { ...await state.get('user'), flujo: 'pedirNumeroPracticanteAsignadoFlow' }
        });
        
        // Actualizar flujo del usuario en BD
        await switchFlujo(ctx.from, 'pedirNumeroPracticanteAsignadoFlow');
        
        await flowDynamic('✅ **Consentimiento aceptado**\n\nGracias por aceptar el tratamiento de datos. Ahora puedes acceder a todos nuestros servicios.');
        
        return gotoFlow(pedirNumeroPracticanteAsignadoFlow);
        
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
          currentFlow: 'numeroPracticanteAsignado',
          user: { ...await state.get('user'), flujo: 'pedirNumeroPracticanteAsignadoFlow' }
        });
        
        await switchFlujo(ctx.from, 'pedirNumeroPracticanteAsignadoFlow');
        
        await flowDynamic('✅ **Consentimiento aceptado**\n\nGracias por aceptar el tratamiento de datos. Ahora puedes acceder a todos nuestros servicios.');
        
        return gotoFlow(pedirNumeroPracticanteAsignadoFlow);
        
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
    await switchFlujo(ctx.from, 'menuFlow') // ARREGLADO - ahora maneja usuarios web
    await state.update({ currentFlow: 'menu' })
    console.log('🟢 MENU_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    '¡Perfecto! Ahora puedes elegir qué hacer:\n\n' +
    '🔹 *1* - Realizar cuestionarios psicológicos\n' +
    '🔹 *2* - Agendar cita con profesional\n\n' +
    'Responde con *_1_* o *_2_*.',
    { capture: true, idle: 600000 }, // Timeout de 10 minutos
    async (ctx, { flowDynamic, gotoFlow, fallBack, endFlow, state }) => {
      try {
        // Manejo de inactividad (timeout)
        if (ctx.idleFallBack) {
          await flowDynamic('Te demoraste en responder, Escribe otra vez para empezar.');
          return endFlow();
        } // sirve para hacer un timeout de 10 mins

        console.log('🟢 MENU_FLOW: Recibido mensaje:', ctx.body);
        const msg = validarRespuestaMenu(ctx.body, ['1', '2']);

        if (msg === '1') {
          // Hacer cuestionarios
          await flowDynamic(menuCuestionarios());
          await switchFlujo(ctx.from, 'testSelectionFlow') // DESCOMENTADO - ahora funciona
          await state.update({ currentFlow: 'testSelection' }); // ACTUALIZAR ESTADO
          return gotoFlow(testSelectionFlow, { body: '' });
          
        } else if (msg === '2') {
          //await flowDynamic('🛠 *Lo sentimos! esta opción no esta disponible en este momento.* \n\n*Pero, puedes realizar una prueba*')
          await switchFlujo(ctx.from, 'agendFlow');
          await flowDynamic('Te ayudaré a agendar tu cita. Por favor, dime qué día te gustaría agendar.');
          return gotoFlow(agendFlow);
          //return fallBack();
          //--
          //Agendar cita
          
        } else {
          // Opción inválida
          await flowDynamic('❌ *Opción no válida. Por favor responde con:*\n' +
          '🔹 *1* - _Para realizar cuestionarios_\n' +
          '🔹 *2* - _Para agendar cita_');        
          return fallBack();
        }
      } catch (error) {
        console.error('❌ Error en menuFlow.addAnswer:', error);
        await flowDynamic('⚠️ Ocurrió un error de conexión. Por favor, intenta enviar tu mensaje de nuevo.');
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

// export const postTestFlow = addKeyword(utils.setEvent('POST_TEST_FLOW'))
//   .addAnswer(
//     '¿Qué te gustaría hacer ahora?\n\n' +
//     '🔹 *1* - Realizar otro cuestionario\n' +
//     '🔹 *2* - Agendar cita\n' +
//     '🔹 *3* - Finalizar por ahora',
//     { capture: true, idle: 300000 }, // Espera 5 minutos
//     async (ctx, { flowDynamic, gotoFlow, fallBack, endFlow }) => {
//       // Si el temporizador se activa (el usuario no responde)
//       if (ctx.idleFallBack) {
//         await flowDynamic('Gracias por usar nuestros servicios. Si necesitas algo más, solo escribe. 👋');
//         return endFlow();
//       }

//       const opcion = ctx.body.trim();
//       if (opcion === '1') {
//         await flowDynamic(menuCuestionarios()); // Asumiendo que menuCuestionarios devuelve el texto del menú
//         return gotoFlow(testSelectionFlow);
//       }
//       if (opcion === '2') {
//         await switchFlujo(ctx.from, 'agendFlow');
//         await flowDynamic('Te ayudaré a agendar tu cita. Por favor, dime qué día te gustaría agendar.');
//         return gotoFlow(agendFlow);
//       }
//       if (opcion === '3') {
//         return endFlow('¡Gracias por usar nuestros servicios! Puedes regresar cuando gustes escribiendo cualquier mensaje.');
//       }
//       return fallBack('❌ Opción no válida. Por favor, responde con *1*, *2* o *3*.');
//     }
//   )

//---------------------------------------------------------------------------------------------------------
// ========================================
// 1. FLUJO PRINCIPAL - SELECCIÓN DE DÍA
// ========================================

// ========================================
// FLUJO COMPLETO DE AGENDAMIENTO - VERSIÓN CONSOLIDADA
// ========================================

export const agendFlow = addKeyword(utils.setEvent('AGEND_FLOW'))
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'agend' });
    console.log('📅 AGEND_FLOW: Inicializado para:', ctx.from);
  })
  // PASO 1: SELECCIÓN DE DÍA
  .addAnswer(
    '📅 *AGENDAR CITA PSICOLÓGICA*\n\n' +
    'Selecciona el día de la semana que prefieres:\n\n' +
    '🔹 *1* - Lunes\n' +
    '🔹 *2* - Martes\n' +
    '🔹 *3* - Miércoles\n' +
    '🔹 *4* - Jueves\n' +
    '🔹 *5* - Viernes\n' +
    '🔹 *6* - Sábado\n\n' +
    'Responde con el *número* del día:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const diaSeleccionado = ctx.body.trim();
      const diasValidos = ['1', '2', '3', '4', '5', '6'];
      
      if (!diasValidos.includes(diaSeleccionado)) {
        await flowDynamic('❌ Opción no válida. Por favor selecciona un número del *1* al *6*.');
        return fallBack();
      }
      
      const mapaDias = {
        '1': 'LUNES',
        '2': 'MARTES',
        '3': 'MIERCOLES',
        '4': 'JUEVES',
        '5': 'VIERNES',
        '6': 'SABADO'
      };
      
      const diaNombre = mapaDias[diaSeleccionado];
      
      await state.update({ 
        diaSeleccionado: diaNombre,
        diaSeleccionadoNumero: diaSeleccionado
      });
      
      console.log('📅 Día seleccionado:', diaNombre);
    }
  )
  // PASO 2: SELECCIÓN DE HORARIO
  .addAnswer(
    '🕐 *SELECCIONAR HORARIO*\n\n' +
    'Elige el rango horario que prefieres:\n\n' +
    '🔹 *1* - Mañana (8:00 AM - 12:00 PM)\n' +
    '🔹 *2* - Tarde (12:00 PM - 5:00 PM)\n' +
    '🔹 *3* - Noche (5:00 PM - 8:00 PM)\n\n' +
    'Responde con el *número* del horario:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      console.log('🕐 Horario recibido:', ctx.body);
      const horarioSeleccionado = ctx.body.trim();
      const horariosValidos = ['1', '2', '3'];
      
      if (!horariosValidos.includes(horarioSeleccionado)) {
        await flowDynamic('❌ Opción no válida. Por favor selecciona *1*, *2* o *3*.');
        return fallBack();
      }
      
      const mapaHorarios = {
        '1': { inicio: 8, fin: 12, nombre: 'Mañana (8:00 AM - 12:00 PM)' },
        '2': { inicio: 12, fin: 17, nombre: 'Tarde (12:00 PM - 5:00 PM)' },
        '3': { inicio: 17, fin: 20, nombre: 'Noche (5:00 PM - 8:00 PM)' }
      };
      
      const horario = mapaHorarios[horarioSeleccionado];
      
      await state.update({ 
        horarioInicio: horario.inicio,
        horarioFin: horario.fin,
        horarioNombre: horario.nombre
      });
      
      console.log('🕐 Horario guardado:', horario);
    }
  )
  // PASO 3: BUSCAR DISPONIBILIDAD (INTEGRADO)
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    console.log('🔵 Iniciando búsqueda integrada...');
    
    const diaSeleccionado = await state.get('diaSeleccionado');
    const horarioInicio = await state.get('horarioInicio');
    const horarioFin = await state.get('horarioFin');
    const horarioNombre = await state.get('horarioNombre');
    const diaNumero = await state.get('diaSeleccionadoNumero');
    
    console.log('📊 Estado completo:', { diaSeleccionado, horarioInicio, horarioFin, diaNumero });
    
    const mapaDiasTexto = {
      '1': 'Lunes',
      '2': 'Martes',
      '3': 'Miércoles',
      '4': 'Jueves',
      '5': 'Viernes',
      '6': 'Sábado'
    };
    
    const diaTexto = mapaDiasTexto[diaNumero];
    
    try {
      await flowDynamic('🔍 Buscando disponibilidad...');
      console.log('🔎 Llamando buscarPracticanteDisponible...');
      
      const practicantesDisponibles = await buscarPracticanteDisponible(
        diaSeleccionado, 
        horarioInicio, 
        horarioFin
      );
      
      console.log('✅ Resultado búsqueda:', practicantesDisponibles?.length || 0);
      
      if (practicantesDisponibles && practicantesDisponibles.length > 0) {
        console.log('✅ HAY DISPONIBILIDAD');
        
        await state.update({ 
          practicantesDisponibles: practicantesDisponibles,
          practicanteSeleccionado: practicantesDisponibles[0]
        });
        
        const mensajeHorarios = formatearHorariosDisponibles(practicantesDisponibles);
        await flowDynamic(mensajeHorarios);
        
        await flowDynamic(
          `📋 *RESUMEN DE TU CITA*\n\n` +
          `📅 *Día:* ${diaTexto}\n` +
          `🕐 *Horario:* ${horarioNombre}\n` +
          `👨‍⚕️ *Psicólogo asignado:* ${practicantesDisponibles[0].nombre}\n\n` +
          `¿Deseas confirmar esta cita?\n\n` +
          `🔹 *1* - Sí, confirmar cita\n` +
          `🔹 *2* - No, volver al menú\n` +
          `🔹 *3* - Cambiar día/horario`
        );
        
        console.log('🔀 Yendo a confirmación...');
        return gotoFlow(agendConfirmarRespuestaFlow);
        
      } else {
        console.log('❌ NO HAY DISPONIBILIDAD');
        await flowDynamic(
          '❌ *Lo sentimos, no hay psicólogos disponibles en este horario.*\n\n' +
          '¿Qué deseas hacer?\n\n' +
          '🔹 *1* - Seleccionar otro día/horario\n' +
          '🔹 *2* - Volver al menú principal'
        );
        
        return gotoFlow(agendSinDisponibilidadFlow);
      }
      
    } catch (error) {
      console.error('❌ ERROR:', error);
      console.error('Stack:', error.stack);
      await flowDynamic('❌ Ocurrió un error. Volviendo al menú...');
      await state.update({ currentFlow: 'menu' });
      await switchFlujo(ctx.from, 'menuFlow');
      return gotoFlow(menuFlow);
    }
  });

// ELIMINA COMPLETAMENTE agendConfirmarFlow - ya no se necesita

// Los demás flujos quedan igual...

// ========================================
// 3. FLUJO PARA BUSCAR Y CONFIRMAR
// ========================================

export const agendConfirmarFlow = addKeyword(utils.setEvent('AGEND_CONFIRMAR_FLOW'))
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    console.log('🔵 agendConfirmarFlow INICIADO');
    
    const diaSeleccionado = await state.get('diaSeleccionado');
    const horarioInicio = await state.get('horarioInicio');
    const horarioFin = await state.get('horarioFin');
    const horarioNombre = await state.get('horarioNombre');
    const diaNumero = await state.get('diaSeleccionadoNumero');
    
    console.log('📊 Estado:', { diaSeleccionado, horarioInicio, horarioFin, diaNumero });
    
    const mapaDiasTexto = {
      '1': 'Lunes',
      '2': 'Martes',
      '3': 'Miércoles',
      '4': 'Jueves',
      '5': 'Viernes',
      '6': 'Sábado'
    };
    
    const diaTexto = mapaDiasTexto[diaNumero];
    
    try {
      console.log('🔍 Enviando mensaje de búsqueda...');
      await flowDynamic('🔍 Buscando disponibilidad...');
      
      console.log('🔎 Llamando buscarPracticanteDisponible...');
      // Buscar practicantes disponibles en BD
      const practicantesDisponibles = await buscarPracticanteDisponible(
        diaSeleccionado, 
        horarioInicio, 
        horarioFin
      );
      
      console.log('✅ Practicantes encontrados:', practicantesDisponibles?.length || 0);
      
      if (practicantesDisponibles && practicantesDisponibles.length > 0) {
        console.log('✅ HAY DISPONIBILIDAD');
                console.log('✅ HAY DISPONIBILIDAD');
        
        // Guardar practicantes en el estado
        await state.update({ 
          practicantesDisponibles: practicantesDisponibles,
          practicanteSeleccionado: practicantesDisponibles[0] // Primer practicante por defecto
        });
        
        console.log('📤 Enviando mensaje de horarios...');
        // Mostrar información de practicantes disponibles
        const mensajeHorarios = formatearHorariosDisponibles(practicantesDisponibles);
        await flowDynamic(mensajeHorarios);
        
        console.log('📤 Enviando mensaje de resumen...');
        // Mostrar resumen y opciones
        await flowDynamic(
          `📋 *RESUMEN DE TU CITA*\n\n` +
          `📅 *Día:* ${diaTexto}\n` +
          `🕐 *Horario:* ${horarioNombre}\n` +
          `👨‍⚕️ *Psicólogo asignado:* ${practicantesDisponibles[0].nombre}\n\n` +
          `¿Deseas confirmar esta cita?\n\n` +
          `🔹 *1* - Sí, confirmar cita\n` +
          `🔹 *2* - No, volver al menú\n` +
          `🔹 *3* - Cambiar día/horario`
        );
        
        console.log('🔀 Redirigiendo a agendConfirmarRespuestaFlow');
        return gotoFlow(agendConfirmarRespuestaFlow);
        
      } else {
        console.log('❌ NO HAY DISPONIBILIDAD');
        // No hay disponibilidad
        await flowDynamic(
          '❌ *Lo sentimos, no hay psicólogos disponibles en este horario.*\n\n' +
          '¿Qué deseas hacer?\n\n' +
          '🔹 *1* - Seleccionar otro día/horario\n' +
          '🔹 *2* - Volver al menú principal'
        );
        
        console.log('🔀 Redirigiendo a agendSinDisponibilidadFlow');
        return gotoFlow(agendSinDisponibilidadFlow);
      }
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO en agendConfirmarFlow:', error);
      console.error('Stack:', error.stack);
      await flowDynamic('❌ Ocurrió un error al buscar disponibilidad. Volviendo al menú...');
      await state.update({ currentFlow: 'menu' });
      await switchFlujo(ctx.from, 'menuFlow');
      return gotoFlow(menuFlow);
    }
  });

// ========================================
// 4. FLUJO RESPUESTA CONFIRMACIÓN
// ========================================

export const agendConfirmarRespuestaFlow = addKeyword(utils.setEvent('AGEND_CONFIRMAR_RESPUESTA_FLOW'))
  .addAnswer(
    '',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const respuesta = ctx.body.trim();
      
      if (respuesta === '1') {
        // ✅ CONFIRMAR CITA
        try {
          await flowDynamic('💾 Guardando tu cita...');
          
          const diaSeleccionado = await state.get('diaSeleccionado');
          const horarioInicio = await state.get('horarioInicio');
          const horarioFin = await state.get('horarioFin');
          const practicanteSeleccionado = await state.get('practicanteSeleccionado');
          
          if (!practicanteSeleccionado) {
            throw new Error('No hay practicante seleccionado');
          }
          
          // Guardar la cita en BD
          const citaData = await guardarCita(
            ctx.from,
            practicanteSeleccionado.idPracticante,
            diaSeleccionado,
            horarioInicio,
            horarioFin
          );
          
          // Formatear y enviar mensaje de confirmación
          const mensajeConfirmacion = formatearMensajeCita(citaData);
          await flowDynamic(mensajeConfirmacion);
          
          await flowDynamic(
            '\n¿Qué deseas hacer ahora?\n\n' +
            '🔹 *1* - Realizar cuestionarios psicológicos\n' +
            '🔹 *2* - Volver al menú principal'
          );
          
          // Limpiar estado de agendamiento
          await state.update({ 
            currentFlow: 'postAgend',
            diaSeleccionado: null,
            horarioInicio: null,
            horarioFin: null,
            practicanteSeleccionado: null,
            practicantesDisponibles: null
          });
          
          return gotoFlow(postAgendFlow);
          
        } catch (error) {
          console.error('❌ Error guardando cita:', error);
          await flowDynamic(
            '❌ *Error al guardar la cita.*\n\n' +
            (error.message === 'Usuario no encontrado' 
              ? 'No se encontró tu información. Por favor, regístrate primero.' 
              : 'Ocurrió un error. Por favor, intenta nuevamente.')
          );
          await state.update({ currentFlow: 'menu' });
          await switchFlujo(ctx.from, 'menuFlow');
          return gotoFlow(menuFlow);
        }
        
      } else if (respuesta === '2') {
        // ❌ CANCELAR - Volver al menú
        await flowDynamic('👋 Entendido. Volviendo al menú principal...');
        await state.update({ 
          currentFlow: 'menu',
          diaSeleccionado: null,
          horarioInicio: null,
          horarioFin: null,
          practicanteSeleccionado: null,
          practicantesDisponibles: null
        });
        await switchFlujo(ctx.from, 'menuFlow');
        return gotoFlow(menuFlow);
        
      } else if (respuesta === '3') {
        // 🔄 CAMBIAR - Reiniciar proceso
        await state.update({
          diaSeleccionado: null,
          horarioInicio: null,
          horarioFin: null,
          practicanteSeleccionado: null,
          practicantesDisponibles: null
        });
        await flowDynamic('🔄 Perfecto. Selecciona nuevamente el día y horario...');
        return gotoFlow(agendFlow);
        
      } else {
        await flowDynamic('❌ Opción no válida. Por favor selecciona *1*, *2* o *3*.');
        return fallBack();
      }
    }
  );

// ========================================
// 5. FLUJO SIN DISPONIBILIDAD
// ========================================

export const agendSinDisponibilidadFlow = addKeyword(utils.setEvent('AGEND_SIN_DISPONIBILIDAD_FLOW'))
  .addAnswer(
    '',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const respuesta = ctx.body.trim();
      
      if (respuesta === '1') {
        // Seleccionar otro horario
        await state.update({
          diaSeleccionado: null,
          horarioInicio: null,
          horarioFin: null,
          practicanteSeleccionado: null,
          practicantesDisponibles: null
        });
        await flowDynamic('🔄 Selecciona nuevamente el día y horario...');
        return gotoFlow(agendFlow);
        
      } else if (respuesta === '2') {
        // Volver al menú
        await flowDynamic('👋 Volviendo al menú principal...');
        await state.update({ 
          currentFlow: 'menu',
          diaSeleccionado: null,
          horarioInicio: null,
          horarioFin: null,
          practicanteSeleccionado: null,
          practicantesDisponibles: null
        });
        await switchFlujo(ctx.from, 'menuFlow');
        return gotoFlow(menuFlow);
        
      } else {
        await flowDynamic('❌ Opción no válida. Por favor selecciona *1* o *2*.');
        return fallBack();
      }
    }
  );

// ========================================
// 6. POST AGEND FLOW - DESPUÉS DE AGENDAR
// ========================================

export const postAgendFlow = addKeyword(utils.setEvent('POST_AGEND_FLOW'))
  .addAnswer(
    '',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const msg = ctx.body.trim();
      
      if (msg === '1') {
        // Hacer cuestionarios
        await flowDynamic(menuCuestionarios());
        await switchFlujo(ctx.from, 'testSelectionFlow');
        await state.update({ currentFlow: 'testSelection' });
        return gotoFlow(testSelectionFlow);
        
      } else if (msg === '2') {
        // Volver al menú
        await flowDynamic('✅ Perfecto. Regresando al menú principal...');
        await state.update({ currentFlow: 'menu' });
        await switchFlujo(ctx.from, 'menuFlow');
        return gotoFlow(menuFlow);
        
      } else {
        await flowDynamic(
          '❌ Opción no válida. Por favor responde:\n\n' +
          '🔹 *1* - Realizar cuestionarios\n' +
          '🔹 *2* - Volver al menú'
        );
        return fallBack();
      }
    }
  );


	//---------------------------------------------------------------------------------------------------------

	