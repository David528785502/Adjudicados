# EsSalud Adjudicaciones - Frontend Angular 19

Frontend moderno para el Sistema de Adjudicación de Plazas de EsSalud desarrollado con Angular 19.

## 🚀 Características

- **Angular 19** con standalone components
- **Angular Material** con tema azul EsSalud
- **2 Tablas Responsive** lado a lado
- **Gestión completa** de postulantes y plazas
- **Filtros avanzados** por grupo ocupacional y estado
- **Acciones directas**: Adjudicar, Desistir, Renunciar

## 📱 Funcionalidades

### Tabla Izquierda - Postulantes
- ✅ Lista de postulantes ordenados por mérito
- ✅ Filtros por grupo ocupacional y estado
- ✅ Estados: Pendiente, Adjudicado, Desistido, Renunció
- ✅ Botones de acción por fila
- ✅ Información de IPRESS adjudicada

### Tabla Derecha - IPRESS y Plazas
- ✅ Plazas disponibles por IPRESS
- ✅ Filtros por red y grupo ocupacional
- ✅ Información de disponibilidad en tiempo real
- ✅ Indicadores visuales de plazas libres
- ✅ Datos: Total, Asignados, Libres

### Botones Inferiores
- 🔄 Crear PDF (pendiente de implementación)
- 🔄 Crear Excel (pendiente de implementación)

## 🛠️ Instalación y Uso

### Prerrequisitos
- Node.js 18+
- Angular CLI 19
- Backend EsSalud ejecutándose en `http://localhost:3000`

### Pasos de instalación

1. **Navegar al directorio**
```bash
cd frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Verificar backend**
Asegúrate de que el backend esté ejecutándose en:
```
http://localhost:3000/api
```

4. **Iniciar desarrollo**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## 🎨 Diseño

### Layout Responsive
- **Desktop**: 2 tablas lado a lado
- **Mobile/Tablet**: Tablas apiladas verticalmente
- **Tema azul** personalizado para EsSalud

### Colores Principales
- **Azul primario**: `#1976d2` (EsSalud)
- **Azul acento**: `#64b5f6`
- **Fondo**: `#f5f5f5`
- **Blanco**: Tablas y tarjetas

## 📊 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts       # Componente principal con las 2 tablas
│   │   ├── services/
│   │   │   └── api.service.ts     # Servicio para conectar con backend
│   │   └── models/
│   │       └── interfaces.ts      # Interfaces TypeScript
│   ├── environments/              # Configuración de entornos
│   ├── styles.scss               # Estilos globales y tema
│   └── index.html               # HTML principal
├── package.json                  # Dependencias del proyecto
├── angular.json                 # Configuración de Angular
└── tsconfig.json               # Configuración de TypeScript
```

## 🔌 Conexión con Backend

El frontend consume los siguientes endpoints del backend:

### Postulantes
- `GET /api/postulantes/con-estado` - Postulantes con estado
- `GET /api/postulantes` - Postulantes con filtros
- `POST /api/adjudicaciones/desistir/:id` - Marcar desistimiento
- `POST /api/adjudicaciones/renuncia/:id` - Marcar renuncia

### Plazas e IPRESS
- `GET /api/plazas/disponibilidad` - Plazas con disponibilidad
- `GET /api/redes` - Listar redes
- `GET /api/grupos-ocupacionales` - Grupos ocupacionales

### Adjudicaciones
- `POST /api/adjudicaciones/adjudicar` - Adjudicación automática
- `GET /api/adjudicaciones/validar` - Validar adjudicación

## 🎯 Funciones Principales

### 1. Gestión de Postulantes
```typescript
// Filtrar postulantes por grupo y estado
filtrarPostulantes() {
  this.apiService.getPostulantes(this.filtroPostulantes)
    .subscribe(response => this.postulantes = response.data);
}

// Marcar como desistido
desistir(postulante: PostulanteConEstado) {
  this.apiService.desistir(postulante.id, request)
    .subscribe(() => this.cargarPostulantes());
}
```

### 2. Visualización de Plazas
```typescript
// Mostrar plazas disponibles con filtros
filtrarPlazas() {
  this.apiService.getPlazasConDisponibilidad(this.filtroPlazas)
    .subscribe(response => this.plazas = response.data);
}
```

### 3. Estados y Badges
- **Pendiente**: Badge naranja
- **Adjudicado**: Badge verde
- **Desistido**: Badge rojo
- **Renunció**: Badge morado

## 🔧 Configuración

### Variables de Entorno
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### Modificar URL del Backend
Si tu backend está en otra dirección:

1. Editar `src/environments/environment.ts`
2. Cambiar `apiUrl` por tu URL
3. Reiniciar `ng serve`

## 🚨 Troubleshooting

### Error: Cannot find module
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Backend no conecta
- Verificar que el backend esté en `http://localhost:3000`
- Revisar CORS en el backend
- Verificar `environment.ts`

### Tablas no responsive
- Verificar estilos CSS en `styles.scss`
- Comprobar Angular Material importado

## 📈 Próximas Mejoras

- [ ] **Modal de adjudicación** para seleccionar plaza específica
- [ ] **Exportación PDF/Excel** funcional
- [ ] **Notificaciones en tiempo real** con WebSockets
- [ ] **Dashboard con gráficos** estadísticos
- [ ] **Filtros avanzados** con rangos de fechas
- [ ] **Paginación** para tablas grandes
- [ ] **Ordenamiento** por columnas
- [ ] **Búsqueda de texto** en tiempo real

## 👥 Desarrollo

### Compilar para producción
```bash
ng build --prod
```

### Ejecutar tests
```bash
ng test
```

### Lint del código
```bash
ng lint
```

---

**Desarrollado para EsSalud** 🏥
**Tecnología**: Angular 19 + Angular Material
**Tema**: Azul institucional EsSalud