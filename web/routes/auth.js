import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Registro
router.post('/register', async (req, res) => {
    try {
        const {
            primerNombre,
            segundoNombre,
            primerApellido,
            segundoApellido,
            telefono,
            segundoTelefono,
            correo,
            segundoCorreo,
            fechaNacimiento,
            perteneceUniversidad,
            password
        } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await prisma.informacionUsuario.findFirst({
            where: {
                OR: [
                    { correo: correo },
                    { telefono: telefono }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Usuario ya existe' });
        }

        // Cifrar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await prisma.informacionUsuario.create({
            data: {
                primerNombre,
                segundoNombre,
                primerApellido,
                segundoApellido,
                telefono,
                segundoTelefono,
                correo,
                segundoCorreo,
                fechaNacimiento: new Date(fechaNacimiento),
                perteneceUniversidad: perteneceUniversidad === 'true',
                password: hashedPassword,
                webRegistered: true,
                webAuthenticated: false,
                consentimientoInformado: false
            }
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: user.id });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Buscar usuario
        const user = await prisma.informacionUsuario.findFirst({
            where: { correo: correo }
        });

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Crear token JWT
        const token = jwt.sign(
            { userId: user.id, correo: user.correo },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        // Actualizar estado de autenticación
        await prisma.informacionUsuario.update({
            where: { id: user.id },
            data: { webAuthenticated: true }
        });

        res.json({ 
            message: 'Login exitoso', 
            token,
            user: {
                id: user.id,
                primerNombre: user.primerNombre,
                correo: user.correo,
                consentimientoInformado: user.consentimientoInformado
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Consentimiento informado
router.post('/consent', async (req, res) => {
    try {
        const { userId } = req.body;

        await prisma.informacionUsuario.update({
            where: { id: parseInt(userId) },
            data: { consentimientoInformado: true }
        });

        res.json({ message: 'Consentimiento registrado' });
    } catch (error) {
        console.error('Error en consentimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Datos sociodemográficos
router.post('/sociodemographic', async (req, res) => {
    try {
        const { userId, semestre, jornada, carrera } = req.body;

        await prisma.informacionUsuario.update({
            where: { id: parseInt(userId) },
            data: {
                semestre,
                jornada,
                carrera,
                datosCompletos: true
            }
        });

        res.json({ message: 'Datos sociodemográficos guardados' });
    } catch (error) {
        console.error('Error en datos sociodemográficos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
