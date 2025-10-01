import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica si un usuario está autenticado desde la web
 * @param {string} telefono - Número de teléfono del usuario
 * @param {Function} flowDynamic - Función para enviar mensajes
 * @returns {Promise<Object|null>} - Usuario si está autenticado, null si no
 */
export const verificarAutenticacionWeb = async (telefono, flowDynamic) => {
    try {
        const user = await prisma.informacionUsuario.findUnique({
            where: { telefonoPersonal: telefono },
            select: {
                idUsuario: true,
                primerNombre: true,
                primerApellido: true,
                isAuthenticated: true,
                consentimientoInformado: true,
                perteneceUniversidad: true,
                semestre: true,
                jornada: true,
                carrera: true,
                flujo: true
            }
        });

        if (!user) {
            console.log('❌ Usuario no encontrado - debe registrarse en la web');
            await flowDynamic('🚫 *Debes registrarte primero*\n\nPara usar este ChatBot, regístrate en nuestra página web:\n\n🌐 http://localhost:3008/register\n\n📝 Una vez registrado, podrás usar todas las funciones del bot.');
            return null;
        }

        if (!user.isAuthenticated) {
            console.log('❌ Usuario no autenticado - debe hacer login en la web');
            await flowDynamic('🔐 *Debes iniciar sesión*\n\nYa tienes una cuenta, pero necesitas iniciar sesión en la página web:\n\n🌐 http://localhost:3008/login\n\n✅ Una vez que inicies sesión, podrás usar el ChatBot normalmente.');
            return null;
        }

        if (!user.consentimientoInformado) {
            console.log('❌ Usuario sin consentimiento - debe completarlo en la web');
            await flowDynamic('📋 *Consentimiento Informado Pendiente*\n\nDebes completar el consentimiento informado en la página web:\n\n🌐 http://localhost:3008/sociodemografico\n\n⚠️ Este paso es obligatorio para usar el servicio de apoyo psicológico.');
            return null;
        }

        // Usuario completamente autenticado
        console.log(`✅ Usuario autenticado: ${user.primerNombre} ${user.primerApellido}`);
        return user;

    } catch (error) {
        console.error('Error verificando autenticación web:', error);
        await flowDynamic('❌ *Error del Sistema*\n\nHubo un problema verificando tu autenticación. Por favor:\n\n1️⃣ Intenta nuevamente en unos minutos\n2️⃣ Si el problema persiste, contacta al soporte técnico');
        return null;
    }
};
