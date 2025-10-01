import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PORT || 3002;
const webHost = process.env.WEB_HOST || 'localhost';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRoutes);

// Ruta principal - redirige al login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rutas de páginas
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/consentimiento', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'consentimiento.html'));
});

app.get('/sociodemografico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sociodemografico.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Manejo de errores
app.use((err, req, res) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🌐 Servidor web corriendo en http://${webHost}:${PORT}`);
});

export default app;
