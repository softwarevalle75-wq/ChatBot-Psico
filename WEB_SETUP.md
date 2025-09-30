# 🌐 Sistema de Autenticación Web - ChatBot Psicológico

## 📋 Resumen de Cambios

Se ha implementado un sistema de autenticación web que requiere que los usuarios se registren y autentiquen antes de poder usar el ChatBot de WhatsApp.

## 🏗️ Arquitectura del Sistema

### Componentes Principales:

1. **Servidor Web** (`web/server.js`) - Servidor Express para las páginas web
2. **Páginas Web**:
   - `login.html` - Página de inicio de sesión
   - `register.html` - Página de registro con todos los campos requeridos
   - `sociodemografico.html` - Consentimiento informado y datos académicos
   - `dashboard.html` - Panel principal del usuario
3. **API de Autenticación** (`web/routes/auth.js`) - Endpoints para registro, login y verificación
4. **Middleware de Seguridad** (`web/middleware/auth.js`) - Verificación de tokens JWT
5. **Helper de Autenticación** (`src/helpers/authHelper.js`) - Integración con el bot
6. **Flujos de Autenticación** (`src/flows/authFlow.js`) - Manejo de usuarios no autenticados

## 🔐 Características de Seguridad

- **Cifrado de contraseñas** con bcrypt (10 rounds)
- **Tokens JWT** para sesiones seguras
- **Validación de datos** en frontend y backend
- **Protección de rutas** con middleware
- **Campos obligatorios** marcados claramente

## 📊 Base de Datos Actualizada

### Nuevos campos en `informacionUsuario`:
- `primerNombre`, `segundoNombre`
- `primerApellido`, `segundoApellido`
- `segundoCorreo`, `segundoTelefono`
- `fechaNacimiento`
- `perteneceUniversidad` (Boolean)
- `semestre`, `jornada`, `carrera` (para universitarios)
- `password` (cifrada)
- `isAuthenticated` (Boolean)
- `consentimientoInformado` (Boolean)

## 🚀 Cómo Ejecutar

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Migrar Base de Datos
```bash
npx prisma db push
```

### 3. Configurar Variables de Entorno
Agregar al archivo `.env`:
```
WEB_PORT=3008
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
WEB_HOST=localhost
```

### 4. Ejecutar Servidor Web
```bash
# Desarrollo
npm run dev-web

# Producción
npm run web
```

### 5. Ejecutar Bot (en otra terminal)
```bash
npm run dev
```

## 🔄 Flujo de Usuario

1. **Registro** → Usuario completa formulario con todos los campos
2. **Login** → Usuario inicia sesión con correo y contraseña
3. **Consentimiento** → Usuario acepta consentimiento informado
4. **Datos Académicos** → Si es universitario, completa semestre/jornada/carrera
5. **Dashboard** → Usuario ve instrucciones para usar el bot
6. **WhatsApp** → Usuario puede usar el bot normalmente

## 🤖 Integración con el Bot

### Verificación Automática:
- Cada mensaje al bot verifica autenticación
- Usuarios no autenticados reciben enlaces a la web
- Usuarios autenticados pueden usar todas las funciones

### Mensajes del Bot:
- **No registrado**: Enlace a `/register`
- **No autenticado**: Enlace a `/login`
- **Sin consentimiento**: Enlace a `/sociodemografico`
- **Datos incompletos**: Enlace a completar datos académicos
- **Autenticado**: Bienvenida personalizada y menú de opciones

## 📱 URLs del Sistema

- **Página principal**: `http://localhost:3008/`
- **Registro**: `http://localhost:3008/register`
- **Login**: `http://localhost:3008/login`
- **Sociodemográfico**: `http://localhost:3008/sociodemografico`
- **Dashboard**: `http://localhost:3000/dashboard`

## 🔧 API Endpoints

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/sociodemografico` - Actualizar datos sociodemográficos
- `GET /api/auth/check-auth/:telefono` - Verificar autenticación (para el bot)
- `POST /api/auth/logout` - Cerrar sesión

## ⚠️ Consideraciones Importantes

1. **Seguridad**: Cambiar `JWT_SECRET` por una clave fuerte en producción
2. **HTTPS**: Usar HTTPS en producción para proteger las credenciales
3. **Base de datos**: Hacer backup antes de migrar en producción
4. **Número del bot**: Actualizar el número de WhatsApp en `dashboard.html`
5. **Dominio**: Actualizar URLs en producción

## 🐛 Solución de Problemas

### Error de migración:
```bash
npx prisma generate
npx prisma db push --force-reset
```

### Error de dependencias:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de permisos JWT:
Verificar que `JWT_SECRET` esté configurado en `.env`

## 📞 Soporte

Para problemas técnicos, verificar:
1. Logs del servidor web
2. Logs del bot
3. Estado de la base de datos
4. Variables de entorno

---

✅ **Sistema listo para usar**. Los usuarios ahora deben registrarse y autenticarse en la web antes de poder usar el ChatBot de WhatsApp.
