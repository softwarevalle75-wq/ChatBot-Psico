// src/flows/pract/practMenuFlow.js
import { addKeyword } from '@builderbot/bot';
import { changeTest, switchFlujo, obtenerUsuario } from '../../queries/queries.js';
import { apiAssistant2 } from '../../flows/assist/assistant2.js';

// --- Opción 2: Consejos a la IA (puedes redirigir a tu assistantFlow si prefieres)
export const practConsejosFlow = addKeyword(['2'])
  .addAnswer(
    '🤖 Escribe tu consulta y te respondo como IA de apoyo para practicantes.\n' +
    'Cuando quieras volver al menú, envía *menu*.', 
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      // Aquí puedes reutilizar tu lógica de IA (aiAssistant) pero con prompt distinto
      // o simplemente redirigir a assistantFlow desde el roleFlow.
      try{
        let user = state.get('user');
        console.log(user)
        if(!user)
          user = await obtenerUsuario(ctx.from);
        console.log(ctx.from)
        console.log(user);
        const response = await apiAssistant2(ctx.from, ctx.body, user.data.idPracticante)
        await flowDynamic(response);
      }catch(err){
        console.log(err);
      }
    }
  );

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

// --- Opción 1 (parte 2): elegir test a asignar
export const practOfrecerTestFlow__ElegirTest = addKeyword('__NUNCA__')
  .addAnswer(
    'Elige el *test* para asignar:\n' +
    '1️⃣ GHQ-12 (tamizaje general)\n' +
    '2️⃣ Beck Depresión (BDI)\n' +
    '3️⃣ Beck Ansiedad (BAI)\n' +
    '4️⃣ Riesgo suicida\n\n' +
    'Responde con *1*, *2*, *3* o *4*.',
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const mapa = { '1': 'ghq12', '2': 'dep', '3': 'ans', '4': 'suic' };
      const opt = (ctx.body || '').trim();
      const tipoTest = mapa[opt];

      if (!tipoTest) {
        await flowDynamic('❌ Opción inválida. Responde 1, 2, 3 o 4.');
        return;
      }

      const tel = await state.get('pacienteTelefono');
      await obtenerUsuario(tel);
      await changeTest(tel, tipoTest);
      await switchFlujo(tel, 'tests');

      await flowDynamic(
        `✅ Listo. Asigné el test *${tipoTest.toUpperCase()}* al paciente *${tel}*.\n` +
        `Cuando el paciente escriba al bot, iniciará el cuestionario.`
      );

      await new Promise(res => setTimeout(res, 500));
      return gotoFlow(practMenuFlow);
    }
  );




// --- Menú principal del practicante (cerrado)
export const practMenuFlow = addKeyword(['menu', 'practicante'])
  .addAnswer(
    '👋 *Menú del practicante*\n' +
    'Elige una opción:\n\n' +
    '1️⃣ Ofrecer test a un usuario\n' +
    '2️⃣ Pedir consejos a la IA\n\n' +
    'Responde con *1* o *2*.',
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic }) => {
      const opt = (ctx.body || '').trim();
      if (opt === '1') return gotoFlow(practOfrecerTestFlow__PedirTelefono);
      if (opt === '2') return gotoFlow(practConsejosFlow);

      await flowDynamic('❌ Opción no válida. Escribe *1* o *2*.');
      return gotoFlow(practMenuFlow);
    }
  );
