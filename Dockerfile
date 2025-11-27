# Imagen base
FROM node:20-alpine3.18

WORKDIR /app

# Paquetes necesarios para dependencias nativas (por si acaso)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Instalar pnpm global
RUN npm install -g pnpm@9

# Copiar archivos de dependencias
COPY package*.json *-lock.yaml ./

# Instalar TODAS las dependencias (incluye prisma CLI)
RUN pnpm install

# Copiar el resto del código
COPY . .

# Generar el cliente de Prisma dentro del contenedor
RUN pnpm prisma generate

# Configurar puerto 
ENV PORT=3000
EXPOSE 3000

# ✅ Ejecuta migraciones AL INICIAR el contenedor, no durante el build
CMD sh -c "pnpm prisma migrate deploy && pnpm start"

# Usar tu script "start": "node start-all.js"
CMD ["pnpm", "start"]

