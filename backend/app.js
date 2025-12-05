require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound, setupMorgan } = require('./src/middleware');

// Importar rutas
const redesRoutes = require('./src/routes/redes');
const ipressRoutes = require('./src/routes/ipress');
const gruposOcupacionalesRoutes = require('./src/routes/grupos-ocupacionales');
const plazasRoutes = require('./src/routes/plazas');
const postulantesRoutes = require('./src/routes/postulantes');
const adjudicacionesRoutes = require('./src/routes/adjudicaciones');

const app = express();

// Configuración básica
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Límite de 100 solicitudes por ventana
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Configuración de CORS
const corsOptions = {
    origin: function (origin, callback) {
        console.log('🌐 CORS check - Origin:', origin);
        
        // En desarrollo, permitir todos los orígenes de localhost
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            console.log('✅ CORS allowed - localhost origin');
            return callback(null, true);
        }
        
        const allowedOrigins = process.env.CORS_ORIGINS ? 
            process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
            ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:5173'];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ CORS allowed - origin in allowlist');
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middlewares globales
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Configuración CORS
app.use(cors(corsOptions));

// Log de debug para CORS
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'sin origin'}`);
    next();
});

// Rate limiting
app.use(limiter);

// Compresión
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging personalizado
app.use(setupMorgan());

// Middleware de información de request
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    next();
});

// Deshabilitar cache para rutas de API para evitar respuestas 304 con datos obsoletos
app.use((req, res, next) => {
    try {
        if (req.path && req.path.startsWith('/api')) {
            // Evitar caches en el cliente y proxys
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('Surrogate-Control', 'no-store');
        }
    } catch (e) {
        // No bloquear la request por errores de headers
    }
    next();
});

// Rutas de salud y información
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/api/info', (req, res) => {
    res.status(200).json({
        name: 'API EsSalud Adjudicaciones',
        version: process.env.npm_package_version || '1.0.0',
        description: 'API para el sistema de adjudicación de plazas de EsSalud',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            redes: '/api/redes',
            ipress: '/api/ipress', 
            gruposOcupacionales: '/api/grupos-ocupacionales',
            plazas: '/api/plazas',
            postulantes: '/api/postulantes',
            adjudicaciones: '/api/adjudicaciones'
        },
        documentation: 'Consulta cada endpoint para ver la documentación específica',
        timestamp: new Date().toISOString()
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Bienvenido a la API de EsSalud Adjudicaciones',
        version: process.env.npm_package_version || '1.0.0',
        documentation: '/api/info',
        health: '/health',
        timestamp: new Date().toISOString()
    });
});

// Rutas principales de la API
app.use('/api/redes', redesRoutes);
app.use('/api/ipress', ipressRoutes);
app.use('/api/grupos-ocupacionales', gruposOcupacionalesRoutes);
app.use('/api/plazas', plazasRoutes);
app.use('/api/postulantes', postulantesRoutes);
app.use('/api/adjudicaciones', adjudicacionesRoutes);

// Middleware de rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Manejo de procesos y señales
process.on('uncaughtException', (err) => {
    console.error('Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rechazo de promesa no manejado en:', promise, 'razón:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('Señal SIGTERM recibida, cerrando servidor gracefully');
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Señal SIGINT recibida, cerrando servidor gracefully');
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🏥 EsSalud Adjudicaciones API                  ║
╚══════════════════════════════════════════════════════════════════╝

🚀 Servidor iniciado exitosamente
📍 Puerto: ${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
⏰ Timestamp: ${new Date().toISOString()}

📋 Endpoints disponibles:
├── 🏥 Redes:                    /api/redes
├── 🏢 IPRESS:                   /api/ipress
├── 👥 Grupos Ocupacionales:     /api/grupos-ocupacionales
├── 💼 Plazas:                   /api/plazas
├── 👤 Postulantes:              /api/postulantes
└── ⚖️  Adjudicaciones:           /api/adjudicaciones

🔗 Enlaces útiles:
├── 📊 Información de la API:    http://localhost:${PORT}/api/info
├── ❤️  Estado del servidor:      http://localhost:${PORT}/health
└── 🏠 Página principal:         http://localhost:${PORT}/

🛡️  Configuración de seguridad:
├── Rate Limiting: ${process.env.RATE_LIMIT_MAX || 100} requests/15min
├── CORS: ${process.env.CORS_ORIGINS ? 'Configurado' : 'Desarrollo'}
├── Helmet: Activado
└── Compression: Activado

💾 Base de datos:
├── Host: ${process.env.DB_HOST || 'localhost'}
├── Puerto: ${process.env.DB_PORT || 5432}
├── Base: ${process.env.DB_NAME || 'adjudicacion_essalud_2'}
└── Usuario: ${process.env.DB_USER || 'usr_essalud'}

Ready para recibir requests! 🎉
    `);
});

module.exports = app;