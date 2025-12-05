const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: false, // Cambiar a true si se requiere SSL
    max: 20, // Máximo número de clientes en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Evento de conexión exitosa
pool.on('connect', (client) => {
    console.log(`🔗 Nueva conexión a PostgreSQL establecida (PID: ${client.processID})`);
});

// Evento de error en el pool
pool.on('error', (err) => {
    console.error('🔴 Error inesperado en el pool de PostgreSQL:', err);
    process.exit(-1);
});

// Función para ejecutar consultas
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`✅ Query ejecutada en ${duration}ms:`, text);
        return result;
    } catch (error) {
        console.error('❌ Error en query:', error);
        throw error;
    }
};

// Función para obtener un cliente del pool (para transacciones)
const getClient = async () => {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        console.error('❌ Error al obtener cliente del pool:', error);
        throw error;
    }
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as current_time, version() as version');
        console.log('🟢 Conexión a PostgreSQL exitosa');
        console.log(`⏰ Tiempo del servidor: ${result.rows[0].current_time}`);
        console.log(`📊 Versión PostgreSQL: ${result.rows[0].version}`);
        return true;
    } catch (error) {
        console.error('🔴 Error al conectar con PostgreSQL:', error);
        return false;
    }
};

// Función para cerrar todas las conexiones
const closePool = async () => {
    try {
        await pool.end();
        console.log('🔒 Pool de conexiones PostgreSQL cerrado correctamente');
    } catch (error) {
        console.error('❌ Error al cerrar pool de PostgreSQL:', error);
    }
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    closePool
};