# EsSalud Adjudicaciones - Backend API

API REST completa para el sistema de adjudicación de plazas de EsSalud, desarrollada con Node.js, Express y PostgreSQL.

## 🚀 Características

- **API REST completa** con todas las operaciones CRUD
- **Base de datos PostgreSQL** con esquema optimizado
- **Validación robusta** con Joi schemas
- **Seguridad** con Helmet, CORS y Rate Limiting
- **Logging** completo con Morgan
- **Manejo de errores** centralizado
- **Documentación** integrada en endpoints
- **Adjudicación automática** con algoritmos inteligentes

## 📋 Entidades del Sistema

### 🏥 Redes
- Gestión de redes asistenciales de EsSalud
- CRUD completo con validaciones

### 🏢 IPRESS (Instituciones Prestadoras de Servicios de Salud)
- Gestión de centros de salud
- Relacionadas con redes asistenciales
- Filtrado por red y tipo

### 👥 Grupos Ocupacionales
- Categorías profesionales (médicos, enfermeros, etc.)
- Niveles jerárquicos y especialidades

### 💼 Plazas
- Puestos de trabajo disponibles
- Estados: disponible, ocupada, reservada
- Filtros avanzados por ubicación y especialidad

### 👤 Postulantes
- Candidatos a las plazas
- Puntajes y orden de mérito
- Estados: activo, desistido, adjudicado

### ⚖️ Adjudicaciones
- Proceso de asignación de plazas
- Algoritmo automático por mérito
- Historial y estadísticas completas

## 🛠️ Instalación

### Prerrequisitos
- Node.js 16+ 
- PostgreSQL 12+
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DB_HOST=192.168.0.51
DB_PORT=5432
DB_NAME=adjudicacion_essalud_2
DB_USER=usr_essalud
DB_PASSWORD=tu_password

# Seguridad
JWT_SECRET=tu_jwt_secret_super_seguro
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

4. **Verificar conexión a base de datos**
```bash
npm run test:db
```

5. **Iniciar servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📡 Endpoints Disponibles

### Información del Sistema
- `GET /` - Página principal
- `GET /health` - Estado del servidor
- `GET /api/info` - Información de la API

### 🏥 Redes (`/api/redes`)
- `GET /` - Listar todas las redes
- `GET /:id` - Obtener red por ID
- `POST /` - Crear nueva red
- `PUT /:id` - Actualizar red
- `DELETE /:id` - Eliminar red
- `GET /stats` - Estadísticas de redes

### 🏢 IPRESS (`/api/ipress`)
- `GET /` - Listar IPRESS con filtros
- `GET /:id` - Obtener IPRESS por ID
- `POST /` - Crear nuevo IPRESS
- `PUT /:id` - Actualizar IPRESS
- `DELETE /:id` - Eliminar IPRESS
- `GET /by-red/:redId` - IPRESS por red
- `GET /stats` - Estadísticas de IPRESS

### 👥 Grupos Ocupacionales (`/api/grupos-ocupacionales`)
- `GET /` - Listar grupos ocupacionales
- `GET /:id` - Obtener grupo por ID
- `POST /` - Crear nuevo grupo
- `PUT /:id` - Actualizar grupo
- `DELETE /:id` - Eliminar grupo
- `GET /activos` - Solo grupos activos
- `GET /stats` - Estadísticas por grupo

### 💼 Plazas (`/api/plazas`)
- `GET /` - Listar plazas con filtros avanzados
- `GET /:id` - Obtener plaza por ID
- `POST /` - Crear nueva plaza
- `PUT /:id` - Actualizar plaza
- `DELETE /:id` - Eliminar plaza
- `GET /disponibles` - Solo plazas disponibles
- `GET /by-grupo/:grupoId` - Plazas por grupo ocupacional
- `GET /stats` - Estadísticas de plazas
- `POST /masivas` - Crear plazas masivamente

### 👤 Postulantes (`/api/postulantes`)
- `GET /` - Listar postulantes con filtros
- `GET /:id` - Obtener postulante por ID
- `POST /` - Crear nuevo postulante
- `PUT /:id` - Actualizar postulante
- `DELETE /:id` - Eliminar postulante
- `GET /by-dni/:dni` - Buscar por DNI
- `GET /orden-merito` - Lista por orden de mérito
- `GET /stats` - Estadísticas de postulantes
- `POST /masivos` - Importar postulantes masivamente

### ⚖️ Adjudicaciones (`/api/adjudicaciones`)
- `GET /` - Listar adjudicaciones
- `GET /:id` - Obtener adjudicación por ID
- `POST /adjudicar` - **Realizar adjudicación automática**
- `POST /masiva` - **Adjudicaciones masivas automáticas**
- `GET /completas` - Adjudicaciones con información completa
- `GET /stats` - Estadísticas generales
- `GET /dashboard` - Dashboard completo
- `POST /desistir/:postulanteId` - Marcar desistimiento
- `POST /renuncia/:postulanteId` - Procesar renuncia
- `PUT /:id/estado` - Actualizar estado
- `POST /revertir/:id` - Revertir adjudicación

## 🔧 Funcionalidades Especiales

### Adjudicación Automática
El sistema incluye algoritmos inteligentes para adjudicación automática:

```javascript
// Adjudicación individual
POST /api/adjudicaciones/adjudicar
{
    "grupoOcupacionalId": 1,
    "ipressId": 5
}

// Adjudicaciones masivas  
POST /api/adjudicaciones/masiva
{
    "grupoOcupacionalId": 1,
    "limite": 10
}
```

### Filtros Avanzados
Todos los endpoints soportan filtros sofisticados:

```javascript
GET /api/plazas?estado=disponible&grupoOcupacionalId=1&ipressId=5&page=1&limit=10
GET /api/postulantes?estado=activo&grupoOcupacionalId=1&ordenMerito=true
```

### Estadísticas y Reportes
Endpoints especializados para análisis:

```javascript
GET /api/adjudicaciones/stats/by-red
GET /api/plazas/stats
GET /api/postulantes/stats
```

## 🛡️ Seguridad

- **Helmet** - Headers de seguridad HTTP
- **CORS** - Control de acceso de dominios cruzados
- **Rate Limiting** - Limitación de peticiones (100/15min)
- **Validación** - Joi schemas en todos los endpoints
- **Sanitización** - Limpieza de datos de entrada
- **Logging** - Registro completo de actividades

## 📊 Monitoreo

### Logs
- Todas las peticiones HTTP son registradas
- Errores con stack traces completos
- Información de performance por endpoint

### Health Check
```bash
curl http://localhost:3000/health
```

### Métricas
- Estadísticas en tiempo real por entidad
- Dashboard con indicadores clave
- Reportes de adjudicaciones

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Test con cobertura
npm run test:coverage

# Test de conexión DB
npm run test:db
```

## 🚀 Despliegue

### Variables de Entorno para Producción
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_servidor_db
DB_PASSWORD=password_seguro
JWT_SECRET=jwt_ultra_seguro
CORS_ORIGINS=https://tu-dominio.com
```

### Docker
```bash
# Construir imagen
docker build -t essalud-api .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env essalud-api
```

## 📝 Estructura del Proyecto

```
backend/
├── app.js                 # Configuración principal del servidor
├── server.js              # Punto de entrada
├── package.json           # Dependencias y scripts
├── .env                   # Variables de entorno
└── src/
    ├── config/
    │   └── database.js     # Configuración PostgreSQL
    ├── models/             # Modelos de datos
    │   ├── BaseModel.js
    │   ├── Red.js
    │   ├── Ipress.js
    │   ├── GrupoOcupacional.js
    │   ├── Plaza.js
    │   ├── Postulante.js
    │   ├── Adjudicacion.js
    │   └── index.js
    ├── controllers/        # Controladores de negocio
    │   ├── BaseController.js
    │   ├── RedController.js
    │   ├── IpressController.js
    │   ├── GrupoOcupacionalController.js
    │   ├── PlazaController.js
    │   ├── PostulanteController.js
    │   ├── AdjudicacionController.js
    │   └── index.js
    ├── middleware/         # Middlewares personalizados
    │   ├── auth.js
    │   ├── validation.js
    │   ├── errorHandler.js
    │   ├── logger.js
    │   └── index.js
    └── routes/             # Definición de rutas
        ├── redes.js
        ├── ipress.js
        ├── grupos-ocupacionales.js
        ├── plazas.js
        ├── postulantes.js
        └── adjudicaciones.js
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 👥 Autores

- **EsSalud Development Team** - *Desarrollo inicial* 

## 🙏 Agradecimientos

- EsSalud por los requerimientos del sistema
- Comunidad Node.js por las herramientas
- PostgreSQL por la robustez de la base de datos

---

**¿Necesitas ayuda?** 
- 📧 Email: soporte@essalud.gob.pe
- 📞 Teléfono: +51-1-XXX-XXXX
- 🌐 Web: https://essalud.gob.pe

¡Gracias por usar la API de EsSalud Adjudicaciones! 🏥✨