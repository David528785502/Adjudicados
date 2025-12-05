const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

/**
 * Utilidades generales para el sistema
 */

/**
 * Formatear respuesta estándar de la API
 */
const formatResponse = (success, data = null, message = '', errors = null) => {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString()
    };
    
    if (data !== null) {
        response.data = data;
    }
    
    if (errors) {
        response.errors = errors;
    }
    
    return response;
};

/**
 * Formatear respuesta con paginación
 */
const formatPaginatedResponse = (data, pagination, message = 'Datos obtenidos exitosamente') => {
    return formatResponse(true, {
        items: data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: pagination.pages,
            hasNext: pagination.page < pagination.pages,
            hasPrev: pagination.page > 1
        }
    }, message);
};

/**
 * Validar si un string es un número
 */
const isNumeric = (str) => {
    return /^\d+$/.test(str);
};

/**
 * Convertir string a número entero seguro
 */
const safeParseInt = (value, defaultValue = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Validar DNI peruano
 */
const isValidDNI = (dni) => {
    return /^\d{8}$/.test(dni);
};

/**
 * Generar código único alfanumérico
 */
const generateUniqueCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Formatear fecha en formato ISO
 */
const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
};

/**
 * Calcular diferencia en días entre dos fechas
 */
const daysDifference = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

/**
 * Capitalizar primera letra de cada palabra
 */
const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Limpiar y normalizar texto
 */
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
};

/**
 * Validar formato de email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Generar slug desde texto
 */
const generateSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Procesar archivo Excel y extraer datos
 */
const processExcelFile = async (filePath, sheetName = null) => {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = sheetName 
            ? workbook.Sheets[sheetName]
            : workbook.Sheets[workbook.SheetNames[0]];
        
        if (!sheet) {
            throw new Error('Hoja de trabajo no encontrada');
        }
        
        const data = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
            blankrows: false
        });
        
        return data;
    } catch (error) {
        throw new Error(`Error al procesar archivo Excel: ${error.message}`);
    }
};

/**
 * Crear archivo Excel desde datos
 */
const createExcelFile = (data, fileName, sheetName = 'Hoja1') => {
    try {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        const filePath = path.join(__dirname, '../../temp', fileName);
        XLSX.writeFile(workbook, filePath);
        
        return filePath;
    } catch (error) {
        throw new Error(`Error al crear archivo Excel: ${error.message}`);
    }
};

/**
 * Limpiar archivos temporales
 */
const cleanupTempFiles = async (maxAge = 24 * 60 * 60 * 1000) => {
    const tempDir = path.join(__dirname, '../../temp');
    
    try {
        const files = await fs.readdir(tempDir);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                await fs.unlink(filePath);
                console.log(`🗑️  Archivo temporal eliminado: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error limpiando archivos temporales:', error);
    }
};

/**
 * Pausar ejecución por X milisegundos
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function con backoff exponencial
 */
const retry = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            
            console.log(`Intento ${i + 1} falló, reintentando en ${delay}ms...`);
            await sleep(delay);
            delay *= 2; // Backoff exponencial
        }
    }
};

/**
 * Generar hash simple (no criptográfico)
 */
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
};

/**
 * Validar que un objeto tenga las propiedades requeridas
 */
const hasRequiredProperties = (obj, requiredProps) => {
    return requiredProps.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== null && obj[prop] !== undefined);
};

/**
 * Filtrar propiedades de un objeto
 */
const filterProperties = (obj, allowedProps) => {
    const filtered = {};
    allowedProps.forEach(prop => {
        if (obj.hasOwnProperty(prop)) {
            filtered[prop] = obj[prop];
        }
    });
    return filtered;
};

/**
 * Agrupar array por propiedad
 */
const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = item[key];
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
};

/**
 * Calcular estadísticas básicas de un array numérico
 */
const calculateStats = (numbers) => {
    if (!numbers || numbers.length === 0) {
        return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    return {
        sum,
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        count: numbers.length
    };
};

module.exports = {
    formatResponse,
    formatPaginatedResponse,
    isNumeric,
    safeParseInt,
    isValidDNI,
    generateUniqueCode,
    formatDate,
    daysDifference,
    capitalizeWords,
    normalizeText,
    isValidEmail,
    generateSlug,
    processExcelFile,
    createExcelFile,
    cleanupTempFiles,
    sleep,
    retry,
    simpleHash,
    hasRequiredProperties,
    filterProperties,
    groupBy,
    calculateStats
};