import { addKeyword } from '@builderbot/bot';
import { setRolTelefono, getRolTelefono, createUsuarioBasico, ensureRolMapping } from '../../queries/queries.js';

const MENU =
  '*Menú Admin*\n' +
  '1) Asignar / cambiar rol a un número\n' +
  '2) Crear usuario con rol\n' +
  '3) Ver rol actual de un número\n' +
  '9) Salir\n\n' +
  'Responde con el número de la opción.';

const askPhone = '📱 Envíame el *número* (con o sin +57).';
const askRole  = '🎭 ¿Qué rol quieres asignar? Escribe: *usuario*, *practicante* o *admin*.';

const normalizePhone = (raw) => (raw || '').replace(/\D/g, '');
const validRoles = new Set(['usuario', 'practicante', 'admin']);

export const adminMenuFlow = addKeyword(['ADMIN_MENU', 'admin'])
  .addAnswer(MENU, { capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
    const opt = (ctx.body || '').trim();

    if (!['1','2','3','9'].includes(opt)) {
      return fallBack('Opción inválida. Intenta de nuevo.\n\n' + MENU);
    }
    if (opt === '9') {
      return await flowDynamic([{ body: 'Saliendo del menú admin. 👋' }]);
    }

    await state.update({ admin_opt: opt });
    return await flowDynamic([{ body: askPhone }]);
  })

  // Paso 2: capturar teléfono
  .addAnswer(null, { capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
    const stepOpt = await state.get('admin_opt');
    if (!stepOpt) return fallBack('Volvamos a empezar.\n\n' + MENU);

    const phone = normalizePhone(ctx.body);
    if (!phone)  return fallBack('Número inválido. ' + askPhone);

    await state.update({ admin_phone: phone });

    if (stepOpt === '3') {
      const mapping = await getRolTelefono(phone);
      const rol = mapping?.rol ?? 'no asignado';
      await state.clear();
      return await flowDynamic([{ body: `📌 Rol actual de ${phone}: *${rol}*` }, { body: '\n' + MENU }]);
    }

    return await flowDynamic([{ body: askRole }]); // opciones 1 y 2 piden rol
  })

  // Paso 3: capturar rol y ejecutar
  .addAnswer(null, { capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
    const stepOpt = await state.get('admin_opt');
    const phone   = await state.get('admin_phone');

    if (!stepOpt || !phone) {
      await state.clear();
      return fallBack('Se perdió el estado. Reiniciemos.\n\n' + MENU);
    }

    const rol = (ctx.body || '').trim().toLowerCase();
    if (!validRoles.has(rol)) {
      return fallBack('Rol inválido. Responde con: usuario / practicante / admin.');
    }

    try {
      if (stepOpt === '1') {
        await setRolTelefono(phone, rol);
        await state.clear();
        return await flowDynamic([{ body: `✅ Rol de ${phone} actualizado a *${rol}*.` }, { body: '\n' + MENU }]);
      }

      if (stepOpt === '2') {
        if (rol === 'usuario') {
          await createUsuarioBasico(phone, {}); // Si quieres pedir nombre/correo, añádelo en pasos extra
        } else {
          await ensureRolMapping(phone, rol); // practicante/admin: mapeo y luego completas su perfil en su flujo
        }
        await state.clear();
        return await flowDynamic([{ body: `✅ Creado/asignado ${phone} con rol *${rol}*.` }, { body: '\n' + MENU }]);
      }

      await state.clear();
      return await flowDynamic([{ body: 'Opción no reconocida. Reiniciemos.' }, { body: '\n' + MENU }]);
    } catch (err) {
      console.error('ADMIN_MENU error:', err);
      await state.clear();
      return await flowDynamic([{ body: '❌ Ocurrió un error realizando la operación.' }, { body: '\n' + MENU }]);
    }
  });
