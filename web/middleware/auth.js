import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token de acceso requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_aqui');
        
        // Verificar que el usuario existe y está autenticado
        const user = await prisma.informacionUsuario.findUnique({
            where: { idUsuario: decoded.userId }
        });

        if (!user || !user.isAuthenticated) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error en verificación de token:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const requireAuth = (req, res, next) => {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.redirect('/login');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_aqui');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.redirect('/login');
    }
};
