import { addKeyword } from '@builderbot/bot';
import { setRolTelefono, getRolTelefono, createUsuarioBasico, ensureRolMapping } from '../../queries/queries.js';

const MENU = `
*Menú Admin*
1️⃣ Asignar / cambiar rol a un número
2️⃣ Crear usuario con rol
3️⃣ Ver rol actual de un número
9️⃣ Salir

Responde con el número de la opción.
`;

const askPhone = '📱 Envíame el *número* (con o sin +57).';
const askRole  = '🎭 ¿Qué rol quieres asignar? Escribe: *usuario*, *practicante* o *admin*.';

const validRoles = new Set(['usuario', 'practicante', 'admin']);
const normalizePhone = (raw) => (raw || '').replace(/\D/g, '');

export const adminMenuFlow = addKeyword(['ADMIN_MENU', 'admin'])
  .addAction(async (_, { state }) => {
    // 🔥 Marcar que estamos en el flujo de admin
    await state.update({ currentMenu: 'admin' });
  })
  // Paso 1: mostrar menú y capturar opción
  .addAnswer(MENU, { capture: true }, async (ctx, { state, flowDynamic, fallBack }) => { // <- Añadir gotoFlow aquí
    const opt = (ctx.body || '').trim();
    if (!['1','2','3','9'].includes(opt)) {
      return fallBack('❌ Opción inválida.\n\n' + MENU);
    }

    if (opt === '9') {
      await state.clear();
      return await flowDynamic('👋 Saliendo del menú admin.');
    }

    await state.update({ currentMenu: 'admin', admin_opt: opt });
    return await flowDynamic(askPhone);
  })

  // Paso 2: capturar teléfono
  .addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => { // <- Añadir gotoFlow aquí
    const currentMenu = await state.get('currentMenu');
    const stepOpt = await state.get('admin_opt');
    if (currentMenu !== 'admin') return; // bloquea si no es admin

    if (!stepOpt) return fallBack('⚠️ Reiniciemos.\n\n' + MENU);

    // Evitar que se envíe otra opción de menú
    if (['1','2','3','9'].includes(ctx.body.trim())) {
      return fallBack('Ya escogiste una opción, ahora envíame el número.\n' + askPhone);
    }

    const phone = normalizePhone(ctx.body);
    if (!phone) return fallBack('❌ Número inválido. ' + askPhone);

    await state.update({ admin_phone: phone });

    if (stepOpt === '3') {
      const mapping = await getRolTelefono(phone);
      const rol = mapping?.rol ?? 'no asignado';
      await state.clear();
      await flowDynamic(`📌 Rol actual de ${phone}: *${rol}*\n\n${MENU}`);
      return gotoFlow(adminMenuFlow); // <- Aquí la clave: volver al flujo admin
    }

    return await flowDynamic(askRole);
  })

  // Paso 3: capturar rol y ejecutar acción
  .addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => { // <- Añadir gotoFlow aquí
    const currentMenu = await state.get('currentMenu');
    const stepOpt = await state.get('admin_opt');
    const phone   = await state.get('admin_phone');
    if (currentMenu !== 'admin') return; // bloquea si no es admin

    if (!stepOpt || !phone) {
      await state.clear();
      return fallBack('⚠️ Se perdió el estado. Reiniciemos.\n\n' + MENU);
    }

    const rol = (ctx.body || '').trim().toLowerCase();
    if (!validRoles.has(rol)) {
      return fallBack('❌ Rol inválido. Escribe: usuario / practicante / admin.');
    }

    try {
      if (stepOpt === '1') {
        await setRolTelefono(phone, rol);
        await flowDynamic(`✅ Rol de ${phone} actualizado a *${rol}*.`);
      }

      if (stepOpt === '2') {
        if (rol === 'usuario') {
          await createUsuarioBasico(phone, {});
        } else {
          await ensureRolMapping(phone, rol);
        }
        await flowDynamic(`✅ Creado/asignado ${phone} con rol *${rol}*.`);
      }
    } catch (err) {
      console.error('ADMIN_MENU error:', err);
      await flowDynamic('❌ Error realizando la operación.');
    } finally {
      await state.clear();
    }

    await flowDynamic(MENU);
    return gotoFlow(adminMenuFlow); // <- Aquí la clave: volver al flujo admin
  });