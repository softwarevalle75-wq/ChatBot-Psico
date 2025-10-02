import { addKeyword, EVENTS } from '@builderbot/bot';
import { checkUserAuthentication, getAuthMessages } from '../helpers/authHelper.js';

const messages = getAuthMessages();

/**
 * Middleware de autenticación que verifica si el usuario puede usar el bot
 */
export const authMiddleware = async (ctx, { flowDynamic, endFlow }) => {
    const telefono = ctx.from;
    console.log(`🔐 Verificando autenticación para: ${telefono}`);
    
    const authStatus = await checkUserAuthentication(telefono);
    
    // Si no está registrado
    if (!authStatus.registered) {
        await flowDynamic(messages.notRegistered);
        return endFlow();
    }
    
    // Si está registrado pero no autenticado
    if (!authStatus.authenticated) {
        await flowDynamic(messages.notAuthenticated);
        return endFlow();
    }
    
    // Si no ha completado el consentimiento informado
    if (!authStatus.consentimientoInformado) {
        await flowDynamic(messages.noConsent);
        return endFlow();
    }
    
    // Si es estudiante universitario pero no ha completado datos académicos
    if (!authStatus.datosCompletos) {
        await flowDynamic(messages.incompleteData);
        return endFlow();
    }
    
    // Si hay error del sistema
    if (authStatus.error) {
        await flowDynamic(messages.error);
        return endFlow();
    }
    
    // Usuario autenticado correctamente
    console.log(`✅ Usuario autenticado: ${authStatus.user.nombre}`);
    
    // Guardar datos del usuario en el contexto para uso posterior
    ctx.userData = authStatus.user;
    
    return true; // Continuar con el flujo normal
};

/**
 * Flujo de bienvenida con verificación de autenticación
 */
export const welcomeAuthFlow = addKeyword(['hola', 'hello', 'hi', 'buenos dias', 'buenas tardes', 'buenas noches', 'inicio', 'empezar'])
    .addAction(async (ctx, { flowDynamic }) => {
        const telefono = ctx.from;
        console.log(`👋 Saludo recibido de: ${telefono}`);
        
        const authStatus = await checkUserAuthentication(telefono);
        
        // Manejar diferentes estados de autenticación
        if (!authStatus.registered) {
            await flowDynamic(messages.notRegistered);
            // return endFlow();
        }
        
        if (!authStatus.authenticated) {
            await flowDynamic(messages.notAuthenticated);
            // return endFlow();
        }
        
        if (!authStatus.consentimientoInformado) {
            await flowDynamic(messages.noConsent);
            // return endFlow();
        }
        
        if (!authStatus.datosCompletos) {
            await flowDynamic(messages.incompleteData);
            // return endFlow();
        }
        
        if (authStatus.error) {
            await flowDynamic(messages.error);
            // return endFlow();
        }
        
        // Usuario autenticado - mostrar bienvenida personalizada
        await flowDynamic(messages.authenticated(authStatus.user.nombre));
        
        // Mostrar opciones disponibles
        const opciones = `
🔹 *Opciones disponibles:*

1️⃣ *Evaluación psicológica* - Realizar test GHQ-12 o DASS-21
2️⃣ *Conversación de apoyo* - Hablar sobre tus preocupaciones
3️⃣ *Agendar cita* - Solicitar cita con un profesional
4️⃣ *Mi perfil* - Ver información de tu cuenta
5️⃣ *Ayuda* - Obtener ayuda sobre el bot

💡 *Escribe el número de la opción que deseas o describe lo que necesitas.*
        `;
        
        await flowDynamic(opciones);
    });

/**
 * Flujo para manejar usuarios no autenticados que intentan usar comandos
 */
export const unauthorizedFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, endFlow }) => {
        // Este flujo se ejecutará para cualquier mensaje si el usuario no está autenticado
        const telefono = ctx.from;
        
        const authStatus = await checkUserAuthentication(telefono);
        
        if (!authStatus.authenticated || !authStatus.consentimientoInformado || !authStatus.datosCompletos) {
            // Determinar qué mensaje mostrar según el estado
            let message;
            
            if (!authStatus.registered) {
                message = messages.notRegistered;
            } else if (!authStatus.authenticated) {
                message = messages.notAuthenticated;
            } else if (!authStatus.consentimientoInformado) {
                message = messages.noConsent;
            } else if (!authStatus.datosCompletos) {
                message = messages.incompleteData;
            } else {
                message = messages.error;
            }
            
            await flowDynamic(message);
            return endFlow();
        }
        
        // Si llega aquí, el usuario está autenticado, continuar con el flujo normal
        return true;
    });

/**
 * Flujo para verificar estado de autenticación
 */
export const checkAuthFlow = addKeyword(['estado', 'status', 'verificar', 'check'])
    .addAction(async (ctx, { flowDynamic }) => {
        const telefono = ctx.from;
        const authStatus = await checkUserAuthentication(telefono);
        
        let statusMessage = `📊 *Estado de tu cuenta:*\n\n`;
        
        statusMessage += `✅ Registrado: ${authStatus.registered ? 'Sí' : 'No'}\n`;
        statusMessage += `🔐 Autenticado: ${authStatus.authenticated ? 'Sí' : 'No'}\n`;
        statusMessage += `📋 Consentimiento: ${authStatus.consentimientoInformado ? 'Completado' : 'Pendiente'}\n`;
        
        if (authStatus.user && authStatus.user.perteneceUniversidad) {
            statusMessage += `📚 Datos académicos: ${authStatus.datosCompletos ? 'Completos' : 'Incompletos'}\n`;
        }
        
        if (authStatus.user) {
            statusMessage += `\n👤 *Información:*\n`;
            statusMessage += `Nombre: ${authStatus.user.nombre}\n`;
            if (authStatus.user.perteneceUniversidad) {
                statusMessage += `Universidad: Universitaria de Colombia\n`;
                if (authStatus.user.semestre) statusMessage += `Semestre: ${authStatus.user.semestre}\n`;
                if (authStatus.user.jornada) statusMessage += `Jornada: ${authStatus.user.jornada}\n`;
                if (authStatus.user.carrera) statusMessage += `Carrera: ${authStatus.user.carrera}\n`;
            }
        }
        
        await flowDynamic(statusMessage);
    });
