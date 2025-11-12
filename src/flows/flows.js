//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import {
	obtenerUsuario,
	changeTest,
  resetearEstadoPrueba,
	switchFlujo,
	//switchAyudaPsicologica,
	guardarPracticanteAsignado,
  perteneceUniversidad,
  verificarRolUsuario,
} from '../queries/queries.js'
//import { apiRegister } from './register/aiRegister.js'
import { menuCuestionarios, parsearSeleccionTest} from './tests/controlTest.js'
//import { apiAgend } from './agend/aiAgend.js'
import { procesarDass21 } from './tests/dass21.js'
import { procesarGHQ12 } from './tests/ghq12.js'
// Importar el helper al inicio del archivo
import { verificarAutenticacionWeb } from '../helpers/auntenticarUsuario.js';
import { adminMenuFlow } from './roles/adminMenuFlow.js'
import { practMenuFlow, practEsperarResultados } from './roles/practMenuFlow.js'
import { 
  buscarPracticanteDisponible, 
  guardarCita, 
  formatearMensajeCita,
  formatearHorariosDisponibles 
} from '../helpers/agendHelper.js';
import Prisma from '@prisma/client'
export const prisma = new Prisma.PrismaClient()
//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { gotoFlow, flowDynamic, state }) => {
    try {
      console.log('🔍 ===== DEBUG CTX COMPLETO =====')
      console.log('ctx.from:', ctx.from)
      console.log('ctx.key:', JSON.stringify(ctx.key, null, 2))
      console.log('🔍 ==============================')
      
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
      if (currentFlow === 'esDeUniversidad') {
        console.log('🚫 Usuario registrando datos universitarios, no interferir con welcomeFlow')
        return;
      }
      if (currentFlow === 'agendConfirmarRespuesta') {
        console.log('🚫 Usuario confirmando cita, no interferir con welcomeFlow')
        return;
      }

      // 2. ⭐ NUEVO: VERIFICAR SI ES PRACTICANTE PRIMERO (ANTES DE AUTENTICAR)
      const rolInfo = await verificarRolUsuario(ctx.from);

      if (rolInfo) {
        // ===== PRACTICANTE =====
        if (rolInfo.rol === 'practicante') {
          console.log('🔑 Practicante detectado -> Enviando a flujo de practicantes SIN autenticación');

          const practicanteCompleto = await prisma.practicante.findUnique({
            where: { telefono: rolInfo.telefono },
            select: {
              idPracticante: true,
              nombre: true,
              telefono: true,
            }
          });

          const usuarioPracticante = {
            tipo: 'practicante',
            data: { 
              idPracticante: practicanteCompleto?.idPracticante || null,
              nombre: practicanteCompleto?.nombre || 'Sin nombre',
              telefono: ctx.from, 
              rol: 'practicante' 
            },
            flujo: 'practMenuFlow'
          };

          console.log('👨‍⚕️ Practicante a guardar:', JSON.stringify(usuarioPracticante, null, 2));
          
          await state.update({ 
            initialized: true, 
            user: usuarioPracticante 
          });
          
          return await handlePracticanteFlow(ctx, usuarioPracticante, state, gotoFlow, flowDynamic);
        }

        // ===== ADMINISTRADOR =====
        if (rolInfo.rol === 'admin') {
          console.log('👑 Administrador detectado -> Enviando a flujo de admin SIN autenticación');

          const usuarioAdmin = {
            tipo: 'admin',
            data: { 
              telefono: ctx.from, 
              rol: 'admin',
              nombre: 'Administrador'
            },
            flujo: 'adminMenuFlow'
          };

          console.log('👑 Admin a guardar:', JSON.stringify(usuarioAdmin, null, 2));
          
          await state.update({ 
            initialized: true, 
            user: usuarioAdmin 
          });
          
          return await handleAdminFlow(ctx, usuarioAdmin, state, gotoFlow, flowDynamic);
        }
      }

      // 3. VERIFICAR AUTENTICACIÓN WEB SOLO PARA USUARIOS NORMALES
      const authUser = await verificarAutenticacionWeb(ctx.from, flowDynamic);
      if (!authUser) return; // Si no está autenticado, parar aquí
      
      // 4. CREAR OBJETO USER CON DATOS AUTENTICADOS
      const usuarioAutenticado = {
        tipo: 'usuario',
        data: authUser,
        flujo: authUser.flujo || 'menuFlow'
      };
      console.log('👤 Usuario autenticado:', usuarioAutenticado);      
      
      // 5. ACTUALIZAR ESTADO CON USUARIO
      await state.update({ initialized: true, user: usuarioAutenticado });

      // 6. Verificar si pertenece a la universidad
      if (authUser.perteneceUniversidad === 'Si'){
        console.log(`${ctx.from} pertenece a la Universitaria`)
        
        await switchFlujo(ctx.from, 'esDeUniversidadFlow');
        await state.update({ currentFlow: 'esDeUniversidad' })
        return gotoFlow(esDeUniversidadFlow)
      }

      // 7. MANEJAR USUARIOS NORMALES - SIEMPRE AL MENÚ (ya están autenticados)
      return await handleUserFlow(ctx, usuarioAutenticado, state, gotoFlow)
      // console.log('✅ Usuario autenticado -> menuFlow');
      // await switchFlujo(ctx.from, 'menuFlow');
      // await state.update({ currentFlow: 'menu' });
      // return gotoFlow(menuFlow);
      
    } catch (e) {
      console.error('❌ welcomeFlow error:', e);
      return gotoFlow(menuFlow);
    }
  }
);

//--------------------------------------------------------------------------------------------------------------
// Función auxiliar para manejar flujo de practicantes
//--------------------------------------------------------------------------------------------------------------

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

//--------------------------------------------------------------------------------------------------------------
// Función auxiliar para manejar flujo de administradores
//--------------------------------------------------------------------------------------------------------------

async function handleAdminFlow(ctx, user, state, gotoFlow) {

  console.log('👑 Administrador detectado -> adminMenuFlow');
  await state.update({ currentFlow: 'admin' });
  return gotoFlow(adminMenuFlow);
}


//--------------------------------------------------------------------------------------------------------------
// Función auxiliar para manejar flujo de usuarios normales
//--------------------------------------------------------------------------------------------------------------


async function handleUserFlow(ctx, user, state, gotoFlow) {
  console.log('📋 Flujo BD:', user.flujo);
  
  switch (user.flujo) {
    // case 'register':
    //   console.log('📝 Usuario en registro -> registerFlow');
    //   await state.update({ currentFlow: 'register' });
    //   return gotoFlow(registerFlow);
      
    // case 'consentimiento_rechazado':
    //   console.log('❌ Usuario rechazó consentimiento -> reconsentFlow');
    //   return gotoFlow(reconsentFlow);
      
    case 'menuFlow':
      console.log('📋 -> menuFlow');
      await state.update({ currentFlow: 'menu' });
      return gotoFlow(menuFlow);
      
    case 'testFlow':
      if (await state.get('currentFlow') !== 'test') {
        console.log('📝 -> testFlow (desde welcomeFlow)');
        await state.update({ 
          currentFlow: 'test',
          justInitializedTest: true,
          user: user,
          testAsignadoPorPracticante: true
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
      if (await state.get('currentFlow') !== 'testSelection') {
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
    // '🔹 *1* - GHQ-12 (Cuestionario de Salud General)\n' +
    // '🔹 *2* - DASS-21 (Depresión, Ansiedad y Estrés)\n\n' +
    // 'Responde con *1* o *2*:',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const user = state.get('user') || {};
      const msg = ctx.body.trim();
      const tipoTest = parsearSeleccionTest(msg);

      if (!tipoTest) {
        await flowDynamic('❌ Por favor, responde con *1* para GHQ-12 o *2* para DASS-21');
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
    'Por favor, proporciona el número de tu psicologo asignado \n\nSi no tienes el número, puedes solicitarlo a tu psicologo.',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const numeroPracticanteAsignado = (ctx.body || '').replace(/\D/g, '');  
      
      console.log('🔵 numeroPracticanteAsignado:', numeroPracticanteAsignado);
      
      if (numeroPracticanteAsignado.length < 8){
        await flowDynamic('El número debe tener al menos 8 dígitos.');
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
    '📋 *TRATAMIENTO DE DATOS PERSONALES*\n\n' +
    'Para continuar con nuestros servicios, necesitamos tu consentimiento para el tratamiento de tus datos personales según la Ley de Protección de Datos.\n\n' +
    '🔹 Tus datos serán utilizados únicamente para brindar servicios psicológicos\n' +
    '🔹 No compartiremos tu información con terceros\n' +
    '🔹 Puedes solicitar la eliminación de tus datos en cualquier momento\n\n' +
    '¿Aceptas el tratamiento de tus datos personales?\n\n' +
    'Responde *"si"* para aceptar o *"no"* para rechazar:',
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
        
        await flowDynamic('✅ *Consentimiento aceptado*\n\nGracias por aceptar el tratamiento de datos. Ahora puedes acceder a todos nuestros servicios.');
        
        return gotoFlow(pedirNumeroPracticanteAsignadoFlow);
        
      } else if (respuesta === 'no') {
        // Usuario rechaza el tratamiento de datos
        // Marcar en BD que rechazó el consentimiento
        await switchFlujo(ctx.from, 'consentimiento_rechazado');
        
        await flowDynamic('❌ *Lo sentimos, pero no puedes continuar si no aceptas el tratamiento de datos.*\n\nSi cambias de opinión, puedes escribirnos nuevamente en cualquier momento.\n\n¡Que tengas un buen día! 👋');
        
        return endFlow();
        
      } else {
        // Respuesta inválida
        await flowDynamic('❌ Por favor responde únicamente *"si"* para aceptar o *"no"* para rechazar el tratamiento de datos.');
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
    '❌ *No puedes acceder al sistema porque rechazaste el tratamiento de datos.*\n\n' +
    'Si has cambiado de opinión y deseas aceptar el tratamiento de datos, escribe *"acepto"* para continuar.',
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
        
        await flowDynamic('✅ *Consentimiento aceptado*\n\nGracias por aceptar el tratamiento de datos. Ahora puedes acceder a todos nuestros servicios.');
        
        return gotoFlow(pedirNumeroPracticanteAsignadoFlow);
        
      } else {
        // Cualquier otra respuesta = rechaza de nuevo
        await flowDynamic('❌ *Debes escribir "acepto" para continuar.*\n\nSi no deseas aceptar el tratamiento de datos, no podrás usar nuestros servicios.\n\n¡Que tengas un buen día! 👋');
        
        return endFlow();
      }
    }
  );

//---------------------------------------------------------------------------------------------------------

const validarRespuestaMenu = (respuesta, opcionesValidas) => {
    const resp = respuesta?.toString().trim();
    return opcionesValidas.includes(resp) ? resp : null;
};

export const menuFlow = addKeyword(utils.setEvent('MENU_FLOW'))
  .addAction(async (ctx, { state }) => {
    // Actualizar flujo solo cuando realmente llegamos al menú
    await switchFlujo(ctx.from, 'menuFlow') // ARREGLADO - ahora maneja usuarios web
    await state.update({ currentFlow: 'menu' })
    console.log('🟢 MENU_FLOW: Inicializado para:', ctx.from);
  })
  .addAnswer(
    '¡Perfecto! Ahora puedes elegir qué hacer:\n\n' +
    '🔹 1 - Realizar cuestionarios psicológicos\n' +
    '🔹 2 - Agendar cita con profesional\n\n' +
    'Responde con 1 o 2.',
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
          //await flowDynamic('🛠 Lo sentimos! esta opción no esta disponible en este momento. \n\n*Pero, puedes realizar una prueba*')
          await switchFlujo(ctx.from, 'agendFlow');
          await flowDynamic('Te ayudaré a agendar tu cita. Por favor, dime qué día te gustaría agendar.');
          return gotoFlow(agendFlow);
          //return fallBack();
          //--
          //Agendar cita
          
        } else {
          // Opción inválida
          await flowDynamic('❌ Opción no válida. Por favor responde con:\n' +
          '🔹 1 - Para realizar cuestionarios\n' +
          '🔹 2 - Para agendar cita');        
          return fallBack();
        }
      } catch (error) {
        console.error('❌ Error en menuFlow.addAnswer:', error);
        await flowDynamic('⚠️ Ocurrió un error de conexión. Por favor, intenta enviar tu mensaje de nuevo.');
      }
    }
  );

//---------------------------------------------------------------------------------------------------------

// Pertenece a universidad
export const esDeUniversidadFlow = addKeyword(utils.setEvent('PERTENECE_UNIVERSIDAD'))
  .addAction(async (ctx, { state }) => {
    console.log("(me cago en la puta)")
    await switchFlujo (ctx.from, 'esDeUniversidadFlow')
    await state.update({ currentFlow: 'esDeUniversidad' });    
    console.log('🟢 esDeUniversidadFlow Inicializado para:', ctx.from);
  })
  .addAnswer(
    'Has indicado que *perteneces a la universidad* Universitaria de Colombia \n\n' +
    '👉 Para continuar debes _*ingresar algunos datos*_ a continuación:'
  )
  // capturar carrera
  .addAnswer(
    'Por favor, indica tú carrera:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const carrera = ctx.body.trim();
      console.log(ctx.body)

      if(!carrera || carrera.length < 4 && carrera.length > 50){
        await flowDynamic('❌ Debes ingresar una *carrera válida*')
        return fallBack();
      }

      await state.update({ carrera });
      console.log(`✅ Carrera capturada para: ${ctx.from}`)
    }
  )
  // capturar jornada
  .addAnswer(
    'Ahora, indica tú jornada:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack}) => {
      const jornada = ctx.body.trim();

      if(!jornada || jornada.length < 4 && jornada.length > 50){
        await flowDynamic('❌ Debes ingresar una *jornada válida* _(diurna / nocturna)_')
        return fallBack();
      }

      await state.update ({ jornada });
      console.log(`✅ Jornada capturada para: ${ctx.from}`)
    }
  )
  // capturar semestre
  .addAnswer(
    'Por último, indica tú semestre:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack}) => {
      const semestre = ctx.body.trim();

      if(!semestre || isNaN(semestre) || parseInt(semestre) < 1 || parseInt(semestre) > 9){
        await flowDynamic('❌ Debes ingresar un *semestre válido* _(1-9)_ ')
        return fallBack();
      }

      await state.update({ semestre: parseInt(semestre) });
      console.log(`✅ Semestre capturado para: ${ctx.from}`)
    }
  )
  // Acción guarda en BD
  .addAction(
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const datosUsuario = {
        carrera: await state.get('carrera'),
        jornada: await state.get('jornada'),
        semestre: await state.get('semestre'),
      };

      try{
        // Aqui se guarda en BD
        await perteneceUniversidad(ctx.from, datosUsuario);

        await flowDynamic(
          '✅ Registro completado exitosamente\n' +
          `\n *Carrera:* ${datosUsuario.carrera}` +
          `\n *Jornada:* ${datosUsuario.jornada}` +
          `\n *Semestre:* ${datosUsuario.semestre}` +
          '\n\n🎉 Bienvenido! Ya puedes interactuar con el bot.'
        )

        await state.update({
          currentFlow: 'menu',
          user: {
            ...await state.get('user'), flujo: 'menuFlow'
          }
        });

        await switchFlujo(ctx.from, 'menuFlow')
        return gotoFlow(menuFlow);

      } catch (error) {
        console.error('❌ Error al guardar datos:', error)
        await flowDynamic('❌ Hubo un problema al guardar tus datos, intenta nuevamente')
      }
  })

//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { gotoFlow }) => {
		console.log('assistantFlow depreciado - redirigiendo a menuFlow')
		await switchFlujo(ctx.from, 'menuFlow')
		return gotoFlow(menuFlow)
	}
)

export const agendFlow = addKeyword(utils.setEvent('AGEND_FLOW'))
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'agend' });
    console.log('📅 AGEND_FLOW: Inicializado para:', ctx.from);
  })
  // PASO 1: SELECCIÓN DE DÍA
  .addAnswer(
    '📅 AGENDAR CITA PSICOLÓGICA\n\n' +
    'Selecciona el día de la semana que prefieres:\n\n' +
    '🔹 1 - Lunes\n' +
    '🔹 2 - Martes\n' +
    '🔹 3 - Miércoles\n' +
    '🔹 4 - Jueves\n' +
    '🔹 5 - Viernes\n' +
    '🔹 6 - Sábado\n\n' +
    'Responde con el número del día:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const diaSeleccionado = ctx.body.trim();
      const diasValidos = ['1', '2', '3', '4', '5', '6'];
      
      if (!diasValidos.includes(diaSeleccionado)) {
        await flowDynamic('❌ Opción no válida. Por favor selecciona un número del 1 al 6.');
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
    '🕐 SELECCIONAR HORARIO\n\n' +
    'Elige el horario específico que prefieres:\n\n' +
    '🔹 1 - 8:00 - 9:00 AM\n' +
    '🔹 2 - 9:00 - 10:00 AM\n' +
    '🔹 3 - 10:00 - 11:00 AM\n' +
    '🔹 4 - 11:00 AM - 12:00 PM\n' +
    '🔹 5 - 12:00 - 1:00 PM\n' +
    '🔹 6 - 1:00 - 2:00 PM\n' +
    '🔹 7 - 2:00 - 3:00 PM\n' +
    '🔹 8 - 3:00 - 4:00 PM\n' +
    '🔹 9 - 4:00 - 5:00 PM\n\n' +
    'Responde con el número del horario:',
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      console.log('🕐 Horario recibido:', ctx.body);
      const horarioSeleccionado = ctx.body.trim();
      const horariosValidos = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      
      if (!horariosValidos.includes(horarioSeleccionado)) {
        await flowDynamic('❌ Opción no válida. Por favor selecciona un número del 1 al 9.');
        return fallBack();
      }
      
      const mapaHorarios = {
        '1': { inicio: 8, fin: 9, nombre: '8:00 - 9:00 AM', minInicio: 480, minFin: 540 },
        '2': { inicio: 9, fin: 10, nombre: '9:00 - 10:00 AM', minInicio: 540, minFin: 600 },
        '3': { inicio: 10, fin: 11, nombre: '10:00 - 11:00 AM', minInicio: 600, minFin: 660 },
        '4': { inicio: 11, fin: 12, nombre: '11:00 AM - 12:00 PM', minInicio: 660, minFin: 720 },
        '5': { inicio: 12, fin: 13, nombre: '12:00 - 1:00 PM', minInicio: 720, minFin: 780 },
        '6': { inicio: 13, fin: 14, nombre: '1:00 - 2:00 PM', minInicio: 780, minFin: 840 },
        '7': { inicio: 14, fin: 15, nombre: '2:00 - 3:00 PM', minInicio: 840, minFin: 900 },
        '8': { inicio: 15, fin: 16, nombre: '3:00 - 4:00 PM', minInicio: 900, minFin: 960 },
        '9': { inicio: 16, fin: 17, nombre: '4:00 - 5:00 PM', minInicio: 960, minFin: 1020 }
      };
      
      const horario = mapaHorarios[horarioSeleccionado];
      
      await state.update({ 
        horarioInicio: horario.inicio,
        horarioFin: horario.fin,
        horarioNombre: horario.nombre,
        minInicio: horario.minInicio,
        minFin: horario.minFin
      });
      
      console.log('🕐 Horario guardado:', horario);
    }
  )
  // PASO 3: BUSCAR DISPONIBILIDAD
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    console.log('🔵 Iniciando búsqueda integrada...');
    
    const diaSeleccionado = await state.get('diaSeleccionado');
    const horarioInicio = await state.get('horarioInicio');
    const horarioFin = await state.get('horarioFin');
    const horarioNombre = await state.get('horarioNombre');
    const fechaSolicitada = await state.get('fechaSolicitada');
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
        horarioFin,
        fechaSolicitada
      );
      
      console.log('✅ Resultado búsqueda:', practicantesDisponibles?.length || 0);
      
      if (practicantesDisponibles && practicantesDisponibles.length > 0) {
        console.log('✅ HAY DISPONIBILIDAD');
        
        await state.update({ 
          practicantesDisponibles: practicantesDisponibles,
          practicanteSeleccionado: practicantesDisponibles[0],
          hayDisponibilidad: true
        });
        
        const mensajeHorarios = formatearHorariosDisponibles(practicantesDisponibles);
        await flowDynamic(mensajeHorarios);
        
        await flowDynamic(
          '📋 *RESUMEN DE TU CITA*\n\n' +
          `📅 *Día:* ${diaTexto}\n` +
          `🕐 *Horario:* ${horarioNombre}\n` +
          `👨‍⚕️ *Psicólogo asignado:* ${practicantesDisponibles[0].nombre}\n\n` +
          '¿Deseas confirmar esta cita?\n\n' +
          '✅ *1* - Sí, confirmar cita\n' +
          '❌ *2* - No, volver al menú\n' +
          '📅 *3* - Cambiar día/horario'
        );
        
      } else {
        console.log('❌ NO HAY DISPONIBILIDAD');
        
        await state.update({ 
          hayDisponibilidad: false
        });
        
        await flowDynamic(
          '❌ Lo sentimos, no hay psicólogos disponibles en este horario.\n\n' +
          '¿Qué deseas hacer?\n\n' +
          '🔹 1 - Seleccionar otro día/horario\n' +
          '🔹 2 - Volver al menú principal'
        );
      }
      
    } catch (error) {
      console.error('❌ ERROR:', error);
      console.error('Stack:', error.stack);
      await flowDynamic('❌ Ocurrió un error. Volviendo al menú...');
      await state.update({ currentFlow: 'menu' });
      await switchFlujo(ctx.from, 'menuFlow');
      return gotoFlow(menuFlow);
    }
  })
  // PASO 4: CAPTURAR RESPUESTA (DISPONIBILIDAD O NO)
  .addAnswer(
    '',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const respuesta = ctx.body.trim();
      const hayDisponibilidad = await state.get('hayDisponibilidad');
      
      console.log('📥 Respuesta recibida:', respuesta, '| Disponibilidad:', hayDisponibilidad);
      
      if (hayDisponibilidad) {
        // ==== CASO: HAY DISPONIBILIDAD (opciones 1, 2, 3) ====
        
        if (respuesta === '1') {
          // ✅ CONFIRMAR CITA
          try {
            await flowDynamic('💾 Guardando tu cita...');
            
            const diaSeleccionado = await state.get('diaSeleccionado');
            const horarioInicio = await state.get('horarioInicio');
            const horarioFin = await state.get('horarioFin');
            const fechaSolicitada = await state.get('fechaSolicitada');
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
              horarioFin,
              fechaSolicitada
            );
            
            // Formatear y enviar mensaje de confirmación
            const mensajeConfirmacion = formatearMensajeCita(citaData);
            await flowDynamic(mensajeConfirmacion);
            
            await flowDynamic(
              '\n¿Qué deseas hacer ahora?\n\n' +
              '🔹 1 - Realizar cuestionarios psicológicos\n' +
              '🔹 2 - Volver al menú principal'
            );
            
            // Actualizar estado para capturar siguiente respuesta
            await state.update({ 
              citaConfirmada: true,
              diaSeleccionado: null,
              horarioInicio: null,
              horarioFin: null,
              practicanteSeleccionado: null,
              practicantesDisponibles: null,
              hayDisponibilidad: null
            });
            
          } catch (error) {
            console.error('❌ Error guardando cita:', error);

            if (error.message.includes('consultorios disponibles')) {
              await flowDynamic(
                '🏥 Lo sentimos, todos los consultorios están ocupados en este horario.\n\n' +
                '¿Qué deseas hacer?\n\n' +
                '🔹 1 - Seleccionar otro día/horario\n' +
                '🔹 2 - Volver al menú principal'
              );

              await state.update({ hayDisponibilidad: false });
              return fallBack();
            }

            await flowDynamic(
              '❌ Error al guardar la cita.\n\n' +
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
            practicantesDisponibles: null,
            hayDisponibilidad: null
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
            practicantesDisponibles: null,
            hayDisponibilidad: null
          });
          await flowDynamic('🔄 Perfecto. Selecciona nuevamente el día y horario...');
          await switchFlujo(ctx.from, 'agendFlow');
          return gotoFlow(agendFlow);
          
        } else {
          await flowDynamic('❌ Opción no válida. Por favor selecciona 1, 2 o 3.');
          return fallBack();
        }
        
      } else {
        // ==== CASO: NO HAY DISPONIBILIDAD (opciones 1, 2) ====
        
        if (respuesta === '1') {
          // ✅ Seleccionar otro horario
          console.log('🔄 Usuario elige cambiar día/horario');
          
          await state.update({
            diaSeleccionado: null,
            horarioInicio: null,
            horarioFin: null,
            practicanteSeleccionado: null,
            practicantesDisponibles: null,
            hayDisponibilidad: null
          });
          
          await flowDynamic('🔄 Perfecto. Selecciona nuevamente el día y horario...');
          await switchFlujo(ctx.from, 'agendFlow');
          return gotoFlow(agendFlow);
          
        } else if (respuesta === '2') {
          // ✅ Volver al menú
          console.log('👋 Usuario vuelve al menú');
          
          await flowDynamic('👋 Volviendo al menú principal...');
          
          await state.update({ 
            currentFlow: 'menu',
            diaSeleccionado: null,
            horarioInicio: null,
            horarioFin: null,
            practicanteSeleccionado: null,
            practicantesDisponibles: null,
            hayDisponibilidad: null
          });
          
          await switchFlujo(ctx.from, 'menuFlow');
          return gotoFlow(menuFlow);
          
        } else {
          await flowDynamic('❌ Opción no válida. Por favor selecciona 1 o 2.');
          return fallBack();
        }
      }
    }
  )
  // PASO 5: POST-CONFIRMACIÓN (CUESTIONARIOS O MENÚ)
  .addAnswer(
    '',
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state, fallBack }) => {
      const citaConfirmada = await state.get('citaConfirmada');
      
      // Solo procesar si hay una cita confirmada
      if (!citaConfirmada) {
        return;
      }
      
      const msg = ctx.body.trim();
      
      if (msg === '1') {
        // Hacer cuestionarios
        await flowDynamic(menuCuestionarios());
        await switchFlujo(ctx.from, 'testSelectionFlow');
        await state.update({ 
          currentFlow: 'testSelection',
          citaConfirmada: null
        });
        return gotoFlow(testSelectionFlow);
        
      } else if (msg === '2') {
        // Volver al menú
        await flowDynamic('✅ Perfecto. Regresando al menú principal...');
        await state.update({ 
          currentFlow: 'menu',
          citaConfirmada: null
        });
        await switchFlujo(ctx.from, 'menuFlow');
        return gotoFlow(menuFlow);
        
      } else {
        await flowDynamic(
          '❌ Opción no válida. Por favor responde:\n\n' +
          '🔹 1 - Realizar cuestionarios\n' +
          '🔹 2 - Volver al menú'
        );
        return fallBack();
      }
    }
  );


	//---------------------------------------------------------------------------------------------------------