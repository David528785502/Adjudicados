const app = require('./app');

// Este archivo es el punto de entrada principal
// app.js contiene toda la lógica de configuración
// server.js solo inicia el servidor

console.log('🚀 Iniciando EsSalud Adjudicaciones API...');
console.log('📝 Configuración cargada desde variables de entorno');
console.log('🔗 Para más información visita: http://localhost:' + (process.env.PORT || 3000));