-- ============================================================================
-- SCRIPT COMPLETO PARA CREAR BASE DE DATOS
-- Sistema de Adjudicación de Plazas - EsSalud
-- PostgreSQL 12+
-- ============================================================================
-- IMPORTANTE: Ejecuta este script completo en una terminal psql o pgAdmin
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR BASE DE DATOS (Si no existe)
-- ============================================================================
-- NOTA: Ejecuta estas líneas desde psql conectado como postgres
-- Si ya existe la base de datos, comenta estas líneas

-- Desconectar usuarios activos (opcional)
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'adjudicacion_essalud_2';

-- Eliminar base de datos si existe (CUIDADO: Borra todos los datos)
-- DROP DATABASE IF EXISTS adjudicacion_essalud_2;

-- Crear base de datos
-- CREATE DATABASE adjudicacion_essalud_2
--     WITH 
--     OWNER = postgres
--     ENCODING = 'UTF8'
--     LC_COLLATE = 'Spanish_Peru.1252'
--     LC_CTYPE = 'Spanish_Peru.1252'
--     TABLESPACE = pg_default
--     CONNECTION LIMIT = -1;

-- COMENTARIO: Conéctate a la base de datos antes de continuar:
-- \c adjudicacion_essalud_2

-- ============================================================================
-- PASO 2: ELIMINAR TABLAS EXISTENTES (Para recrear esquema limpio)
-- ============================================================================
DROP TABLE IF EXISTS adjudicaciones CASCADE;
DROP TABLE IF EXISTS postulantes CASCADE;
DROP TABLE IF EXISTS plazas CASCADE;
DROP TABLE IF EXISTS grupos_ocupacionales CASCADE;
DROP TABLE IF EXISTS ipress CASCADE;
DROP TABLE IF EXISTS redes CASCADE;

-- ============================================================================
-- PASO 3: CREAR TABLAS
-- ============================================================================

-- Tabla: redes
-- Almacena las redes de salud (RED TACNA, GOF, CENATE, etc.)
CREATE TABLE redes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE redes IS 'Redes de salud de EsSalud';
COMMENT ON COLUMN redes.nombre IS 'Nombre de la red (ej: RED TACNA, GOF, CENATE)';

-- Tabla: ipress
-- Almacena los establecimientos de salud
CREATE TABLE ipress (
    id SERIAL PRIMARY KEY,
    red_id INTEGER NOT NULL REFERENCES redes(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(red_id, nombre)
);

COMMENT ON TABLE ipress IS 'Instituciones Prestadoras de Servicios de Salud';
COMMENT ON COLUMN ipress.nombre IS 'Nombre del establecimiento de salud';

-- Tabla: grupos_ocupacionales
-- Almacena los grupos ocupacionales
CREATE TABLE grupos_ocupacionales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE grupos_ocupacionales IS 'Grupos ocupacionales (ENFERMERA, MEDICO, etc.)';

-- Tabla: plazas
-- Almacena las plazas disponibles
-- **INCLUYE NUEVA COLUMNA: subunidad**
CREATE TABLE plazas (
    id SERIAL PRIMARY KEY,
    ipress_id INTEGER NOT NULL REFERENCES ipress(id) ON DELETE CASCADE,
    grupo_ocupacional_id INTEGER NOT NULL REFERENCES grupos_ocupacionales(id) ON DELETE CASCADE,
    subunidad VARCHAR(200),  -- NUEVA COLUMNA: Subunidad organizacional
    especialidad VARCHAR(200),
    total INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_total_positivo CHECK (total >= 0),
    UNIQUE(ipress_id, grupo_ocupacional_id, subunidad, especialidad)
);

COMMENT ON TABLE plazas IS 'Plazas disponibles por IPRESS y grupo ocupacional';
COMMENT ON COLUMN plazas.total IS 'Total de plazas (cupos) disponibles';
COMMENT ON COLUMN plazas.subunidad IS 'Subunidad organizacional (ej: Emergencia, UCI, Consulta Externa)';
COMMENT ON COLUMN plazas.especialidad IS 'Especialidad específica si aplica';

-- Tabla: postulantes
-- Almacena los postulantes aptos
CREATE TABLE postulantes (
    id SERIAL PRIMARY KEY,
    orden_merito INTEGER NOT NULL,
    apellidos_nombres VARCHAR(200) NOT NULL,
    dni VARCHAR(8),
    fecha_inicio_contrato DATE,
    tiempo_servicio_anios INTEGER DEFAULT 0,
    tiempo_servicio_meses INTEGER DEFAULT 0,
    tiempo_servicio_dias INTEGER DEFAULT 0,
    horas_capacitacion INTEGER DEFAULT 0,
    grupo_ocupacional_id INTEGER NOT NULL REFERENCES grupos_ocupacionales(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_om_positivo CHECK (orden_merito > 0)
);

COMMENT ON TABLE postulantes IS 'Postulantes aptos para adjudicación';
COMMENT ON COLUMN postulantes.orden_merito IS 'Orden de mérito dentro de su grupo ocupacional';

-- Tabla: adjudicaciones
-- Almacena el historial de adjudicaciones y estados
CREATE TABLE adjudicaciones (
    id SERIAL PRIMARY KEY,
    postulante_id INTEGER NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    plaza_id INTEGER REFERENCES plazas(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_adjudicacion TIMESTAMP,
    fecha_desistimiento TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_estado_valido CHECK (estado IN ('pendiente', 'adjudicado', 'desistido', 'renuncio')),
    CONSTRAINT check_adjudicacion_valida CHECK (
        (estado = 'pendiente' AND plaza_id IS NULL AND fecha_adjudicacion IS NULL) OR
        (estado = 'adjudicado' AND plaza_id IS NOT NULL AND fecha_adjudicacion IS NOT NULL) OR
        (estado = 'desistido' AND plaza_id IS NULL AND fecha_desistimiento IS NOT NULL) OR
        (estado = 'renuncio' AND plaza_id IS NOT NULL AND fecha_adjudicacion IS NOT NULL AND fecha_desistimiento IS NOT NULL)
    ),
    UNIQUE(postulante_id)
);

COMMENT ON TABLE adjudicaciones IS 'Registro de adjudicaciones y estados de postulantes';
COMMENT ON COLUMN adjudicaciones.estado IS 'Estados: pendiente, adjudicado, desistido, renuncio';

-- ============================================================================
-- PASO 4: CREAR ÍNDICES
-- ============================================================================
CREATE INDEX idx_plazas_ipress ON plazas(ipress_id);
CREATE INDEX idx_plazas_grupo ON plazas(grupo_ocupacional_id);
CREATE INDEX idx_plazas_subunidad ON plazas(subunidad);
CREATE INDEX idx_postulantes_om ON postulantes(orden_merito);
CREATE INDEX idx_postulantes_grupo ON postulantes(grupo_ocupacional_id);
CREATE INDEX idx_adjudicaciones_postulante ON adjudicaciones(postulante_id);
CREATE INDEX idx_adjudicaciones_plaza ON adjudicaciones(plaza_id);
CREATE INDEX idx_adjudicaciones_estado ON adjudicaciones(estado);
CREATE INDEX idx_ipress_red ON ipress(red_id);

-- ============================================================================
-- PASO 5: CREAR VISTAS
-- ============================================================================

-- Vista: plazas_con_disponibilidad
-- Muestra plazas con asignados y libres calculados dinámicamente
-- **INCLUYE COLUMNA subunidad**
CREATE OR REPLACE VIEW plazas_con_disponibilidad AS
SELECT
    p.id,
    r.nombre AS red,
    i.nombre AS ipress,
    go.nombre AS grupo_ocupacional,
    p.subunidad,
    p.especialidad,
    p.total,
    COALESCE(COUNT(a.id) FILTER (WHERE a.estado = 'adjudicado'), 0)::INTEGER AS asignados,
    (p.total - COALESCE(COUNT(a.id) FILTER (WHERE a.estado = 'adjudicado'), 0))::INTEGER AS libres
FROM plazas p
INNER JOIN ipress i ON p.ipress_id = i.id
INNER JOIN redes r ON i.red_id = r.id
INNER JOIN grupos_ocupacionales go ON p.grupo_ocupacional_id = go.id
LEFT JOIN adjudicaciones a ON p.id = a.plaza_id AND a.estado = 'adjudicado'
GROUP BY p.id, r.nombre, i.nombre, go.nombre, p.subunidad, p.especialidad, p.total
ORDER BY r.nombre, i.nombre, go.nombre, p.subunidad;

COMMENT ON VIEW plazas_con_disponibilidad IS 'Vista con plazas y disponibilidad en tiempo real';

-- Vista: postulantes_con_estado
-- Muestra postulantes con su estado actual
CREATE OR REPLACE VIEW postulantes_con_estado AS
SELECT
    pos.id,
    pos.orden_merito,
    pos.apellidos_nombres,
    pos.dni,
    pos.fecha_inicio_contrato,
    pos.tiempo_servicio_anios,
    pos.tiempo_servicio_meses,
    pos.tiempo_servicio_dias,
    pos.horas_capacitacion,
    go.nombre AS grupo_ocupacional,
    COALESCE(adj.estado, 'pendiente') AS estado,
    r.nombre AS red_adjudicada,
    i.nombre AS ipress_adjudicada,
    pl.subunidad AS subunidad_adjudicada,
    adj.fecha_adjudicacion,
    adj.fecha_desistimiento,
    adj.observaciones
FROM postulantes pos
LEFT JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
LEFT JOIN plazas pl ON adj.plaza_id = pl.id
LEFT JOIN ipress i ON pl.ipress_id = i.id
LEFT JOIN redes r ON i.red_id = r.id
ORDER BY go.nombre, pos.orden_merito;

COMMENT ON VIEW postulantes_con_estado IS 'Vista con estado actual de postulantes';

-- ============================================================================
-- PASO 6: CREAR TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_redes_updated_at
    BEFORE UPDATE ON redes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_ipress_updated_at
    BEFORE UPDATE ON ipress
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_grupos_updated_at
    BEFORE UPDATE ON grupos_ocupacionales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_plazas_updated_at
    BEFORE UPDATE ON plazas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_postulantes_updated_at
    BEFORE UPDATE ON postulantes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_adjudicaciones_updated_at
    BEFORE UPDATE ON adjudicaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================================
-- PASO 7: INSERTAR DATOS INICIALES (Redes y Grupos Ocupacionales)
-- ============================================================================

-- Insertar Redes
INSERT INTO redes (nombre) VALUES 
    ('RED TACNA'),
    ('GOF'),
    ('CENATE'),
    ('RED ALMENARA'),
    ('RED REBAGLIATI'),
    ('RED SABOGAL')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar Grupos Ocupacionales
INSERT INTO grupos_ocupacionales (nombre) VALUES 
    ('ENFERMERA'),
    ('MEDICOS'),
    ('MEDICO ESPECIALISTA'),
    ('CONDUCTOR DE AMBULANCIA'),
    ('DIGITADOR ASISTENCIAL'),
    ('PSICOLOGO'),
    ('QUIMICO FARMACEUTICO'),
    ('TECNICO DE ENFERMERIA'),
    ('TECNICO NO DIPLOMADO'),
    ('TECNOLOGO MEDICO')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- PASO 8: FUNCIONES ÚTILES
-- ============================================================================

-- Función: Obtener plazas disponibles por grupo ocupacional
CREATE OR REPLACE FUNCTION obtener_plazas_disponibles(p_grupo_ocupacional_id INTEGER)
RETURNS TABLE (
    plaza_id INTEGER,
    red VARCHAR,
    ipress VARCHAR,
    subunidad VARCHAR,
    especialidad VARCHAR,
    total INTEGER,
    asignados INTEGER,
    libres INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        r.nombre,
        i.nombre,
        p.subunidad,
        p.especialidad,
        p.total,
        COALESCE(COUNT(a.id) FILTER (WHERE a.estado = 'adjudicado'), 0)::INTEGER,
        (p.total - COALESCE(COUNT(a.id) FILTER (WHERE a.estado = 'adjudicado'), 0))::INTEGER
    FROM plazas p
    INNER JOIN ipress i ON p.ipress_id = i.id
    INNER JOIN redes r ON i.red_id = r.id
    LEFT JOIN adjudicaciones a ON p.id = a.plaza_id AND a.estado = 'adjudicado'
    WHERE p.grupo_ocupacional_id = p_grupo_ocupacional_id
    GROUP BY p.id, r.nombre, i.nombre, p.subunidad, p.especialidad, p.total
    HAVING (p.total - COALESCE(COUNT(a.id) FILTER (WHERE a.estado = 'adjudicado'), 0)) > 0
    ORDER BY r.nombre, i.nombre, p.subunidad;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 9: VERIFICACIÓN DEL ESQUEMA
-- ============================================================================

-- Verificar tablas creadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar vistas creadas
SELECT table_name as vista
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar datos iniciales
SELECT 'Redes', COUNT(*) FROM redes
UNION ALL
SELECT 'Grupos Ocupacionales', COUNT(*) FROM grupos_ocupacionales
UNION ALL
SELECT 'IPRESS', COUNT(*) FROM ipress
UNION ALL
SELECT 'Plazas', COUNT(*) FROM plazas
UNION ALL
SELECT 'Postulantes', COUNT(*) FROM postulantes
UNION ALL
SELECT 'Adjudicaciones', COUNT(*) FROM adjudicaciones;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- La base de datos está lista para uso
-- 
-- Próximos pasos:
-- 1. Cargar datos de IPRESS (desde Excel o CSV)
-- 2. Cargar datos de plazas (desde Excel 6911626)
-- 3. Cargar datos de postulantes (desde Excel RESULTADOS APTOS)
-- 4. Crear registros de adjudicaciones (estado pendiente por defecto)
-- ============================================================================

-- Consultas útiles de ejemplo:
-- SELECT * FROM plazas_con_disponibilidad WHERE libres > 0;
-- SELECT * FROM postulantes_con_estado WHERE estado = 'pendiente';
-- SELECT * FROM obtener_plazas_disponibles(1);  -- 1 = id del grupo ocupacional
