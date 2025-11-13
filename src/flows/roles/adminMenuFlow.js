// ==================== adminMenuFlow.js ====================

import { addKeyword } from '@builderbot/bot';
import { setRolTelefono, getRolTelefono, createUsuarioBasico, ensureRolMapping, obtenerUsuario } from '../../queries/queries.js';

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

// ========== FLUJO DE ENTRADA ==========
// ========== FLUJO DE ENTRADA SIMPLIFICADO ==========
export const adminEntryFlow = addKeyword(['admin'])
  .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
    console.log('🔐 AdminEntryFlow - Usuario ya verificado en welcomeFlow');
    
    const user = await state.get('user');
    console.log('👤 User en estado:', user);
    
    if (!user || !user.data || user.data.rol !== 'admin') {
      console.log('❌ Error: Usuario perdió estado admin');
      await flowDynamic('❌ Error de sesión. Escribe "menu" para reintentar.');
      return 
    }
    
    await state.update({ currentFlow: 'admin' });
    await flowDynamic('👑 Accediendo al panel de administración...');
    
    console.log('🔀 Redirigiendo a adminMenuFlow');
    return gotoFlow(adminMenuFlow);
  });

// ========== MENÚ PRINCIPAL ==========
// CAMBIO IMPORTANTE: Usar keywords específicas en lugar de __NUNCA__
export const adminMenuFlow = addKeyword(['1', '2', '3', '9', 'menu'])
  .addAction(async (_, { state }) => {
    await state.update({ currentFlow: 'admin' });
    console.log('🔥 Admin Menu Flow - Estado actualizado');
  })
  .addAnswer('👑 *Panel de Administración*')
  .addAnswer(
    MENU, 
    { capture: true }, 
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      console.log('📥 Admin Menu - Opción recibida:', ctx.body);
      const opt = (ctx.body || '').trim();
      
      // Validar opción
      if (!['1','2','3','9'].includes(opt)) {
        await flowDynamic('❌ Opción inválida. Responde con *1*, *2*, *3* o *9*.');
        return gotoFlow(adminMenuFlow);
      }

      // Opción de salir
      if (opt === '9') {
        await state.clear();
        return await flowDynamic('👋 Saliendo del menú admin.');
      }

      // Guardar opción y continuar
      console.log('✅ Opción válida, guardando:', opt);
      await state.update({ admin_opt: opt });
      console.log('🔀 Redirigiendo a adminPedirTelefonoFlow');
      return gotoFlow(adminPedirTelefonoFlow);
    }
  );

// ========== PEDIR TELÉFONO ==========
// CAMBIO: Usar keyword de captura universal
export const adminPedirTelefonoFlow = addKeyword(['__capture_only__'])
  .addAction(async (_, { state, flowDynamic }) => {
    await state.update({ currentFlow: 'admin' });
    console.log('📱 Admin Pedir Teléfono - Inicializado');
    
    // Enviar pregunta solo si es la primera vez
    const phoneAsked = await state.get('phone_asked');
    if (!phoneAsked) {
      await state.update({ phone_asked: true });
      await flowDynamic(askPhone);
    }
  })
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      console.log('📥 Teléfono recibido:', ctx.body);
      const stepOpt = await state.get('admin_opt');
      
      // Verificar que exista la opción guardada
      if (!stepOpt) {
        console.log('⚠️ No hay admin_opt, reiniciando');
        await flowDynamic('⚠️ Se perdió la opción. Reiniciemos.');
        await state.clear();
        return gotoFlow(adminMenuFlow);
      }

      // Evitar que se envíe otra opción de menú
      if (['1','2','3','9'].includes(ctx.body.trim())) {
        await flowDynamic('Ya escogiste una opción, ahora envíame el *número de teléfono*.');
        return gotoFlow(adminPedirTelefonoFlow);
      }

      // Validar teléfono
      const phone = normalizePhone(ctx.body);
      if (!phone || phone.length < 8) {
        await flowDynamic('❌ Número inválido. Escribe solo números, al menos 8 dígitos.');
        return gotoFlow(adminPedirTelefonoFlow);
      }

      console.log('✅ Teléfono normalizado:', phone);
      await state.update({ 
        admin_phone: phone,
        phone_asked: false // Reset flag
      });

      // OPCIÓN 3: Ver rol actual (termina aquí)
      if (stepOpt === '3') {
        console.log('🔍 Consultando rol para:', phone);
        try {
          const mapping = await getRolTelefono(phone);
          const rol = mapping?.rol ?? 'no asignado';
          await flowDynamic(`📌 Rol actual de ${phone}: *${rol}*`);
        } catch (err) {
          console.error('Error consultando rol:', err);
          await flowDynamic('❌ Error consultando el rol.');
        }
        
        await state.clear();
        console.log('🔙 Volviendo a adminMenuFlow');
        return gotoFlow(adminMenuFlow);
      }

      // Opciones 1 y 2: continuar al flujo de asignar rol
      console.log('🔀 Continuando a adminAsignarRolFlow');
      return gotoFlow(adminAsignarRolFlow);
    }
  );

// ========== ASIGNAR ROL ==========
// CAMBIO: Usar keyword de captura universal
export const adminAsignarRolFlow = addKeyword(['__capture_only__'])
  .addAction(async (_, { state, flowDynamic }) => {
    await state.update({ currentFlow: 'admin' });
    console.log('👤 Admin Asignar Rol - Inicializado');
    
    // Enviar pregunta solo si es la primera vez
    const roleAsked = await state.get('role_asked');
    if (!roleAsked) {
      await state.update({ role_asked: true });
      await flowDynamic(askRole);
    }
  })
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      console.log('📥 Rol recibido:', ctx.body);
      const stepOpt = await state.get('admin_opt');
      const phone   = await state.get('admin_phone');
      
      // Verificar que existan los datos necesarios
      if (!stepOpt || !phone) {
        console.log('⚠️ Falta stepOpt o phone, reiniciando');
        await state.clear();
        await flowDynamic('⚠️ Se perdió el estado. Reiniciemos.');
        return gotoFlow(adminMenuFlow);
      }

      // Validar rol
      const rol = (ctx.body || '').trim().toLowerCase();
      if (!validRoles.has(rol)) {
        await flowDynamic('❌ Rol inválido. Escribe: *usuario*, *practicante* o *admin*.');
        return gotoFlow(adminAsignarRolFlow);
      }

      // Procesar la asignación
      console.log('✅ Procesando:', { stepOpt, phone, rol });
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
      }

      // Limpiar y volver al menú
      await state.clear();
      console.log('🔙 Volviendo a adminMenuFlow');
      return gotoFlow(adminMenuFlow);
    }
  );

// ========== MIDDLEWARE SIMPLIFICADO ==========
export const adminMenuMiddleware = addKeyword(['menu'])
  .addAction(async (ctx, { state, gotoFlow, endFlow }) => {
    console.log('📋 Middleware menu - verificando si es admin');
    const user = state.get('user') || await obtenerUsuario(ctx.from);
    
    if (user && user.rol === 'admin') {
      console.log('✅ Usuario es admin, redirigiendo a menú');
      await state.update({ 
        user: user,
        currentFlow: 'admin'
      });
      return gotoFlow(adminMenuFlow);
    }
    
    console.log('❌ Usuario no es admin, ignorando');
    return endFlow();
  });