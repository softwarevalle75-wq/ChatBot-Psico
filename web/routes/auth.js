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
            telefonoPersonal,
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
                    { telefonoPersonal: telefonoPersonal }
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
                telefonoPersonal,
                segundoTelefono,
                correo,
                segundoCorreo,
                fechaNacimiento: new Date(fechaNacimiento),
                perteneceUniversidad: perteneceUniversidad === 'true',
                password: hashedPassword,
                consentimientoInformado: false
            }
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: user.idUsuario });
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
            { userId: user.idUsuario, correo: user.correo },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1h' }
        );

        // Actualizar estado de autenticación
        await prisma.informacionUsuario.update({
            where: { idUsuario: user.idUsuario },
            data: { isAuthenticated: true }
        });

        res.json({ 
            message: 'Login exitoso', 
            token,
            user: {
                id: user.idUsuario,
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
            where: { idUsuario: userId },
            data: { consentimientoInformado: true }
        });

        res.json({ message: 'Consentimiento registrado' });
    } catch (error) {
        console.error('Error en consentimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/sociodemografico', async (req, res) => {
    try {
        const { userId, consentimientoInformado, semestre, jornada, carrera } = req.body;

        const updateData = {};
        
        // Siempre actualizar consentimiento si viene en la petición
        if (consentimientoInformado !== undefined) {
            updateData.consentimientoInformado = consentimientoInformado;
        }
        
        // Solo agregar datos académicos si vienen
        if (semestre) updateData.semestre = semestre;
        if (jornada) updateData.jornada = jornada;
        if (carrera) updateData.carrera = carrera;

        await prisma.informacionUsuario.update({
            where: { idUsuario: userId },
            data: updateData
        });

        res.json({ message: 'Información guardada exitosamente' });
    } catch (error) {
        console.error('Error en datos sociodemográficos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
