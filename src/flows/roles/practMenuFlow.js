// src/flows/pract/practMenuFlow.js
import { addKeyword } from '@builderbot/bot';
import { switchFlujo, obtenerUsuario, sendAutonomousMessage, prisma, changeTest } from '../../queries/queries.js';
import { apiAssistant2 } from '../../flows/assist/assistant2.js';
//import { procesarGHQ12 } from '../../flows/tests/ghq12.js';
//import { procesarDASS21 } from '../../flows/tests/dass21.js';

// --- Opción 2: Consejos a la IA 
export const practConsejosFlow = addKeyword(['__pract_ayuda__']) // Keyword interno
  .addAnswer(
    '🤖 Escribe tu consulta y te respondo como IA de apoyo para practicantes.\n' +
    'Cuando quieras volver al menú, envía *menu*.', 
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
      // Verificar si el usuario escribió "menu" para regresar
      if (ctx.body.toLowerCase().trim() === 'menu') {
        return gotoFlow(practMenuFlow);
      }
      
      try {
        let user = state.get('user');
        console.log(user)
        if (!user) {
          user = await obtenerUsuario(ctx.from);
        }
        console.log(ctx.from)
        console.log(user);
        const response = await apiAssistant2(ctx.from, ctx.body, user.idPracticante)
        await flowDynamic(response);
        
        // Usar fallBack para mantener capture sin repetir mensaje
        return fallBack();
      } catch (err) {
        console.log(err);
        await flowDynamic('❌ Hubo un error procesando tu consulta. Intenta de nuevo.');
        return fallBack();
      }
    }
  );

//------------------------------------------------------------------------------------------------------------------------------


// --- Opción 1 (parte 1): pedir teléfono del paciente
export const practOfrecerTestFlow__PedirTelefono = addKeyword(['__pedir_tel__'])
.addAnswer(
  '📱 *Opción 1: Ofrecer test a un usuario*\n' +
  'Envíame el *teléfono del paciente* (solo números).',
  { capture: true },
  async (ctx, { state, fallBack, gotoFlow, flowDynamic }) => {
    const tel = (ctx.body || '').replace(/\D/g, '');  
    if (tel.length < 8) {
      await flowDynamic('❌ Teléfono inválido. Escribe solo números, al menos 8 dígitos.');
      return fallBack();
      }
      await state.update({ pacienteTelefono: tel });
      return gotoFlow(practOfrecerTestFlow__ElegirTest);
    }
  );
  
  
  //------------------------------------------------------------------------------------------------------------------------------
  export const cambiarFlujoYNotificar = async (numero, nuevoFlujo, mensaje) => {
    try {
      // Cambiar el flujo en la BD
      await switchFlujo(numero, nuevoFlujo);
      
      // Enviar mensaje autónomo
      await sendAutonomousMessage(numero, mensaje);
      
      console.log(`Flujo cambiado a ${nuevoFlujo} y notificación enviada a ${numero}`);
      return true;
    } catch (error) {
      console.error('Error en cambio de flujo y notificación:', error);
      throw error;
    }
  }

  //-------------------------------------------------------------------------------------------------------------------------------

  // --- Opción 1 (parte 2): elegir test a asignar
export const practOfrecerTestFlow__ElegirTest = addKeyword('__NUNCA__')
.addAction(async (_, { state }) => {
    await state.update({ currentFlow: 'practicante' });
    console.log('🔥 Estado actualizado - currentFlow: practicante');
  })
.addAnswer(
    'Elige el *test* para asignar:\n' +
    '1️⃣ GHQ-12 (tamizaje general)\n' +
    '2️⃣ DASS-21\n' +
    // '3️⃣ Beck Ansiedad (BAI)\n' +
    // '4️⃣ Riesgo suicida\n\n' +
    'Responde con *1* o *2*.',
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow, fallBack }) => {
      const mapa = { '1': 'ghq12', '2': 'dass21' };
      const opt = (ctx.body || '').trim();
      const tipoTest = mapa[opt];
      
      if (!tipoTest) {
        await flowDynamic('❌ Opción inválida. Responde *1* o *2*');
        return fallBack();
      }
      
      let tel = await state.get('pacienteTelefono');
      tel = 57 + tel;
      console.log(tel);
      
      // Obtener info del practicante actual
      const user = state.get('user');
      await obtenerUsuario(tel);  
      console.log(await obtenerUsuario(tel));  
      
      // Asignar el practicante al paciente
      console.log(`🔍 DEBUG: User completo:`, user);
      if (user && user.data && user.data.idPracticante) {
        try {
          console.log(`🔍 DEBUG: Intentando asignar practicante ${user.data.idPracticante} al paciente ${tel}`);
          await prisma.informacionUsuario.update({
            where: { telefonoPersonal: tel },
            data: { practicanteAsignado: user.data.idPracticante }
          });
          console.log(`✅ Practicante ${user.data.idPracticante} asignado al paciente ${tel}`);
          
          // Verificar que se guardó correctamente
          const verificacion = await prisma.informacionUsuario.findUnique({
            where: { telefonoPersonal: tel },
            select: { practicanteAsignado: true }
          });
          console.log(`🔍 DEBUG: Verificación - practicanteAsignado guardado:`, verificacion);
        } catch (error) {
          console.error('❌ Error asignando practicante:', error);
        }
      } else {
        console.log(`❌ DEBUG: No se puede asignar practicante. User:`, user);
      }
      
      // Asignar el tipo de test específico al paciente
      try {
        await changeTest(tel, tipoTest);
        console.log(`✅ Test ${tipoTest} asignado al paciente ${tel}`);
      } catch (error) {
        console.error('❌ Error asignando test:', error);
      }
      
      await cambiarFlujoYNotificar(tel, 'testFlow', `Se te ha asignado una prueba, escribe al bot para iniciar.`)
      
      await flowDynamic(
        `✅ Listo. Asigné el test *${tipoTest.toUpperCase()}* al paciente *${tel}*.\n` +
        `Cuando el paciente escriba al bot, iniciará el cuestionario.`
      );

      await new Promise(res => setTimeout(res, 500));    
      await state.update({ currentFlow: 'esperandoResultados' });
      console.log('🔥 Estado actualizado - currentFlow: esperandoResultados');
      return gotoFlow(practEsperarResultados);
    }
  );

  //------------------------------------------------------------------------------------------------------------------------------

  export const practEsperarResultados = addKeyword('__ESPERAR_RESULTADOS__')
  .addAction(async (_, { state }) => {
    await state.update({ 
      currentFlow: 'esperandoResultados',
      esperandoResultados: true
     });
    console.log('🔥 Estado actualizado - currentFlow: esperandoResultados');
  })
  .addAnswer(
    '⏳ Por favor, espera a que el paciente termine su prueba.',   
    { capture: true },
    async (_, { flowDynamic, fallBack, state }) => {      
      
      // 🔥 VERIFICAR SI HAY UNA BANDERA DE TEST COMPLETADO EN EL ESTADO
      const testCompletado = await state.get('testCompletadoPorPaciente');
      if (testCompletado) {
        console.log('✅ Test completado detectado por bandera de estado en practEsperarResultados');
        await flowDynamic('✅ *Test completado.* Regresando al menú principal...');
        
        // Limpiar la bandera y cambiar estado
        await state.update({
          testCompletadoPorPaciente: false,
          currentFlow: 'practicante',
          esperandoResultados: false
        });
        
        return;
      }      
      
      // Usar fallBack() para mantener el flujo activo y seguir capturando mensajes
      return fallBack();
    }
  )

  //------------------------------------------------------------------------------------------------------------------------------
  
  
  
  // --- Menú principal del practicante (con validación de rol)
  export const practMenuFlow = addKeyword(['__NUNCA__'])
  .addAction(async (ctx, { state }) => {
    await state.update({ currentFlow: 'practicante' });
  })
  .addAnswer(
    '👋 *Menú del practicante*\n' +
    'Elige una opción:\n\n' +
    '1️⃣ Ofrecer test a un usuario\n' +
    '2️⃣ Pedir consejos a la IA\n\n' +
    'Responde con *1* o *2*.',
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
      const opt = (ctx.body || '').trim();
      if (opt === '1') return gotoFlow(practOfrecerTestFlow__PedirTelefono);
      if (opt === '2') return gotoFlow(practConsejosFlow);
      
      await flowDynamic('❌ Opción no válida. Escribe *1* o *2*.');
      return fallBack();
    }
  );
  

  //------------------------------------------------------------------------------------------------------------------------------
  
  
  // --- Flujo de entrada para practicantes (este sí debe ser accesible)
  export const practEntryFlow = addKeyword(['practicante'])
  .addAction(async (ctx, { state }) => {
    // Verificar si el usuario es practicante
    const user = await obtenerUsuario(ctx.from);
    if (!user || !user.idPracticante) {
      return; // No es practicante, no hacer nada
    }
    await state.update({ user: user, currentFlow: 'practicante' });
  })
  .addAnswer(async (ctx, { state, gotoFlow, endFlow }) => {
    const user = state.get('user');
    if (!user || !user.idPracticante) {
      return endFlow('❌ No tienes permisos de practicante.');
    }
    return gotoFlow(practMenuFlow);
  });
  
  
  //------------------------------------------------------------------------------------------------------------------------------
  
  
  // --- Middleware global para manejar "menu" solo cuando estés en flujo practicante
  export const practMenuMiddleware = addKeyword(['menu'])
  .addAction(async (ctx, { state, gotoFlow, endFlow }) => {
    const currentFlow = state.get('currentFlow');
    if (currentFlow === 'practicante') {
      const user = state.get('user') || await obtenerUsuario(ctx.from);
      if (user && user.idPracticante) {
        await state.update({ user: user });
        return gotoFlow(practMenuFlow);
      }
    }
    return endFlow(); // No hacer nada si no está en flujo practicante
  });
  
  
  //------------------------------------------------------------------------------------------------------------------------------
  



