import { spawn } from 'child_process';

console.log('🚀 Iniciando ChatBot Psicológico con Sistema Web...\n');

// Iniciar servidor web
console.log('🌐 Iniciando servidor web...');
const webServer = spawn('node', ['web/server.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
});

// Esperar un momento antes de iniciar el bot
setTimeout(() => {
    console.log('🤖 Iniciando bot de WhatsApp...');
    const botServer = spawn('node', ['src/app.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    botServer.on('close', (code) => {
        console.log(`Bot terminado con código ${code}`);
        webServer.kill();
        process.exit(code);
    });
}, 3000);

webServer.on('close', (code) => {
    console.log(`Servidor web terminado con código ${code}`);
    process.exit(code);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servicios...');
    webServer.kill();
    process.exit(0);
});
