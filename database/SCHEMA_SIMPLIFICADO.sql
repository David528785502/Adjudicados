-- ============================================================================
-- SCHEMA SIMPLIFICADO - Sistema de Adjudicación de Plazas EsSalud
-- ============================================================================
-- Este esquema contiene solo los datos esenciales necesarios para el sistema
-- ============================================================================

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS adjudicaciones CASCADE;
DROP TABLE IF EXISTS plazas CASCADE;
DROP TABLE IF EXISTS postulantes CASCADE;
DROP TABLE IF EXISTS ipress CASCADE;
DROP TABLE IF EXISTS grupos_ocupacionales CASCADE;
DROP TABLE IF EXISTS redes CASCADE;

-- ============================================================================
-- TABLA: redes
-- ============================================================================
CREATE TABLE redes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: ipress
-- ============================================================================
CREATE TABLE ipress (
    id SERIAL PRIMARY KEY,
    red_id INTEGER NOT NULL REFERENCES redes(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(red_id, nombre)
);

-- ============================================================================
-- TABLA: grupos_ocupacionales
-- ============================================================================
CREATE TABLE grupos_ocupacionales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: plazas
-- Campos según formato de carga: red, ipress, sub unidad, cant. Plazas
-- Nota: especialidad se puede agregar manualmente después de la carga
-- ============================================================================
CREATE TABLE plazas (
    id SERIAL PRIMARY KEY,
    ipress_id INTEGER NOT NULL REFERENCES ipress(id) ON DELETE CASCADE,
    grupo_ocupacional_id INTEGER NOT NULL REFERENCES grupos_ocupacionales(id) ON DELETE CASCADE,
    subunidad VARCHAR(200),
    especialidad VARCHAR(200),
    total INTEGER NOT NULL DEFAULT 1 CHECK (total > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plazas_ipress ON plazas(ipress_id);
CREATE INDEX idx_plazas_grupo ON plazas(grupo_ocupacional_id);

-- ============================================================================
-- TABLA: postulantes
-- Campos según formato de carga: OM, Apellidos, Nombres, Grupo Ocupacional
-- Nota: fecha_registro es cuando se carga al sistema (automático)
-- ============================================================================
CREATE TABLE postulantes (
    id SERIAL PRIMARY KEY,
    orden_merito INTEGER NOT NULL UNIQUE CHECK (orden_merito > 0),
    apellidos VARCHAR(200) NOT NULL,
    nombres VARCHAR(200) NOT NULL,
    grupo_ocupacional_id INTEGER NOT NULL REFERENCES grupos_ocupacionales(id) ON DELETE RESTRICT,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_postulantes_orden ON postulantes(orden_merito);
CREATE INDEX idx_postulantes_grupo ON postulantes(grupo_ocupacional_id);

-- ============================================================================
-- TABLA: adjudicaciones
-- Almacena el estado de cada postulante y su plaza asignada (si tiene)
-- ============================================================================
CREATE TABLE adjudicaciones (
    id SERIAL PRIMARY KEY,
    postulante_id INTEGER NOT NULL UNIQUE REFERENCES postulantes(id) ON DELETE CASCADE,
    plaza_id INTEGER REFERENCES plazas(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'adjudicado', 'desistido', 'renuncio', 'ausente')),
    fecha_adjudicacion TIMESTAMP,
    fecha_desistimiento TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adjudicaciones_postulante ON adjudicaciones(postulante_id);
CREATE INDEX idx_adjudicaciones_plaza ON adjudicaciones(plaza_id);
CREATE INDEX idx_adjudicaciones_estado ON adjudicaciones(estado);

-- ============================================================================
-- VISTA: postulantes_con_estado
-- Información completa de postulantes con su estado de adjudicación
-- ============================================================================
CREATE OR REPLACE VIEW postulantes_con_estado AS
SELECT 
    p.id,
    p.orden_merito,
    CONCAT(p.apellidos, ' ', p.nombres) AS apellidos_nombres,
    p.apellidos,
    p.nombres,
    p.grupo_ocupacional_id,
    go.nombre AS grupo_ocupacional,
    p.fecha_registro,
    COALESCE(adj.estado, 'pendiente') AS estado,
    r.nombre AS red_adjudicada,
    i.nombre AS ipress_adjudicada,
    pl.subunidad AS subunidad_adjudicada,
    go_adj.nombre AS grupo_ocupacional_adjudicado,
    pl.especialidad AS especialidad_adjudicada,
    adj.fecha_adjudicacion,
    adj.fecha_desistimiento,
    adj.observaciones
FROM postulantes p
INNER JOIN grupos_ocupacionales go ON p.grupo_ocupacional_id = go.id
LEFT JOIN adjudicaciones adj ON p.id = adj.postulante_id
LEFT JOIN plazas pl ON adj.plaza_id = pl.id
LEFT JOIN ipress i ON pl.ipress_id = i.id
LEFT JOIN redes r ON i.red_id = r.id
LEFT JOIN grupos_ocupacionales go_adj ON pl.grupo_ocupacional_id = go_adj.id;

-- ============================================================================
-- VISTA: plazas_con_disponibilidad
-- Plazas con información de cuántas están asignadas y libres
-- Nota: Grupo Ocupacional se omite en la vista porque ya se filtra en la UI
-- ============================================================================
CREATE OR REPLACE VIEW plazas_con_disponibilidad AS
SELECT 
    p.id,
    r.id AS red_id,
    r.nombre AS red,
    i.id AS ipress_id,
    i.nombre AS ipress,
    go.id AS grupo_ocupacional_id,
    p.subunidad,
    p.especialidad,
    p.total,
    COALESCE(COUNT(adj.id) FILTER (WHERE adj.estado = 'adjudicado'), 0)::INTEGER AS asignados,
    (p.total - COALESCE(COUNT(adj.id) FILTER (WHERE adj.estado = 'adjudicado'), 0))::INTEGER AS libres
FROM plazas p
INNER JOIN ipress i ON p.ipress_id = i.id
INNER JOIN redes r ON i.red_id = r.id
INNER JOIN grupos_ocupacionales go ON p.grupo_ocupacional_id = go.id
LEFT JOIN adjudicaciones adj ON p.id = adj.plaza_id
GROUP BY p.id, r.id, r.nombre, i.id, i.nombre, go.id, p.subunidad, p.especialidad, p.total;

-- ============================================================================
-- FUNCIÓN: validar_adjudicacion
-- Verifica si se puede realizar una adjudicación
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_adjudicacion(
    p_postulante_id INTEGER,
    p_plaza_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_estado_actual VARCHAR(20);
    v_plazas_libres INTEGER;
    v_grupo_postulante INTEGER;
    v_grupo_plaza INTEGER;
BEGIN
    -- Verificar estado del postulante
    SELECT estado INTO v_estado_actual
    FROM adjudicaciones
    WHERE postulante_id = p_postulante_id;
    
    IF v_estado_actual IS NOT NULL AND v_estado_actual != 'pendiente' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar disponibilidad de la plaza
    SELECT libres INTO v_plazas_libres
    FROM plazas_con_disponibilidad
    WHERE id = p_plaza_id;
    
    IF v_plazas_libres IS NULL OR v_plazas_libres <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar compatibilidad de grupo ocupacional (OPCIONAL - comentado)
    -- SELECT grupo_ocupacional_id INTO v_grupo_postulante FROM postulantes WHERE id = p_postulante_id;
    -- SELECT grupo_ocupacional_id INTO v_grupo_plaza FROM plazas WHERE id = p_plaza_id;
    -- IF v_grupo_postulante != v_grupo_plaza THEN
    --     RETURN FALSE;
    -- END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: obtener_plazas_disponibles
-- Retorna el número de plazas libres
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_plazas_disponibles(p_plaza_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_libres INTEGER;
BEGIN
    SELECT libres INTO v_libres
    FROM plazas_con_disponibilidad
    WHERE id = p_plaza_id;
    
    RETURN COALESCE(v_libres, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: actualizar updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_redes_updated_at
    BEFORE UPDATE ON redes
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_ipress_updated_at
    BEFORE UPDATE ON ipress
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_grupos_updated_at
    BEFORE UPDATE ON grupos_ocupacionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_plazas_updated_at
    BEFORE UPDATE ON plazas
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_postulantes_updated_at
    BEFORE UPDATE ON postulantes
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_adjudicaciones_updated_at
    BEFORE UPDATE ON adjudicaciones
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================================
-- DATOS INICIALES: Redes
-- ============================================================================
INSERT INTO redes (nombre) VALUES 
    ('RED TACNA'),
    ('GOF'),
    ('CENATE')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- DATOS INICIALES: Grupos Ocupacionales
-- ============================================================================
INSERT INTO grupos_ocupacionales (nombre) VALUES 
    ('ENFERMERA'),
    ('MEDICOS'),
    ('CONDUCTOR DE AMBULANCIA'),
    ('TECNICO DE ENFERMERIA'),
    ('DIGITADOR ASISTENCIAL'),
    ('MEDICO ESPECIALISTA'),
    ('PSICOLOGO')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- DATOS DE PRUEBA: IPRESS
-- ============================================================================
INSERT INTO ipress (red_id, nombre) VALUES 
    ((SELECT id FROM redes WHERE nombre = 'RED TACNA'), 'HOSPITAL HIPOLITO UNANUE'),
    ((SELECT id FROM redes WHERE nombre = 'RED TACNA'), 'CAP METROPOLITANO'),
    ((SELECT id FROM redes WHERE nombre = 'RED TACNA'), 'POLICLINICO BOLOGNESI'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'CEPRIT'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'CRUEN'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SG ATENCION DOMICILIARIA'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SG STAE'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SGPE-DIRECCIÓN HOSPITAL PERU'),
    ((SELECT id FROM redes WHERE nombre = 'CENATE'), 'CENATE - NIVEL RED')
ON CONFLICT (red_id, nombre) DO NOTHING;

-- ============================================================================
-- DATOS DE PRUEBA: Plazas
-- ============================================================================
INSERT INTO plazas (ipress_id, grupo_ocupacional_id, subunidad, especialidad, total) VALUES
    -- RED TACNA - HOSPITAL HIPOLITO UNANUE
    ((SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), 
     'Emergencia', 'ENFERMERA I - EMERGENCIA', 5),
    ((SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), 
     'UCI', 'ENFERMERA I - UCI', 3),
    ((SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), 
     'Consulta Externa', NULL, 8),
    ((SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA'), 
     'Hospitalización', NULL, 10),
    
    -- GOF - CEPRIT
    ((SELECT id FROM ipress WHERE nombre = 'CEPRIT'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'DIGITADOR ASISTENCIAL'), 
     NULL, NULL, 4),
    ((SELECT id FROM ipress WHERE nombre = 'CEPRIT'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), 
     'Atención COVID', NULL, 10),
    ((SELECT id FROM ipress WHERE nombre = 'CEPRIT'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), 
     NULL, NULL, 3),
    
    -- GOF - SG ATENCION DOMICILIARIA
    ((SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA'), 
     'Unidad Móvil', NULL, 55),
    ((SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), 
     'Atención Domiciliaria', NULL, 25),
    ((SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), 
     'Atención Domiciliaria', NULL, 40),
    ((SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'PSICOLOGO'), 
     'Salud Mental', NULL, 2),
    
    -- CENATE
    ((SELECT id FROM ipress WHERE nombre = 'CENATE - NIVEL RED'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICO ESPECIALISTA'), 
     'Cardiología', 'CARDIOLOGIA', 1),
    ((SELECT id FROM ipress WHERE nombre = 'CENATE - NIVEL RED'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), 
     'Hospitalización', NULL, 11),
    ((SELECT id FROM ipress WHERE nombre = 'CENATE - NIVEL RED'), 
     (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), 
     'Consulta Externa', NULL, 36);

-- ============================================================================
-- DATOS DE PRUEBA: Postulantes
-- Formato de carga: OM | Apellidos | Nombres | Grupo Ocupacional
-- ============================================================================
INSERT INTO postulantes (orden_merito, apellidos, nombres, grupo_ocupacional_id) VALUES
    -- ENFERMERA
    (1, 'SILVA LOPEZ', 'MARIA DEFILIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (2, 'ANCHELIA OSCATE', 'NILDA GUIULIANA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (3, 'MOLERO ESCOBAR', 'FATIMA VIVIANA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (4, 'FLORES PONCE', 'CLAUDIA GABRIELA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (5, 'QUESQUEN MILLONES', 'KARLA GUILIANA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (6, 'GONZALES GOMEZ', 'LILIANA MILAGROS', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (7, 'COLQUEHUANCA USEDO', 'YENIFER', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (8, 'CASTILLO PEREDA', 'LUZ VIRGINIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (9, 'AREVALO LOPEZ', 'KELLY GISELL', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    (10, 'BLANCO JULIAN', 'CANDY VALERIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA')),
    
    -- MEDICOS
    (11, 'AREVALO ROMERO', 'ZURISADAISI', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (12, 'HOYOS PASTOR', 'RAQUEL', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (13, 'CABREJOS ARELLANO', 'LUZ KATHERINE', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (14, 'VELAZCO ZUTA', 'RENAN RICARDO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (15, 'ALEGRIA CACERES', 'CYNTHIA FRANCESCA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (16, 'PEREZ MENDOZA', 'VIRGINIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (17, 'ROMAN SANTILLAN', 'GIANMARCO MANUEL', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    (18, 'ALATRISTA VALDEZ', 'FLAVIA ANDREA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS')),
    
    -- CONDUCTOR DE AMBULANCIA
    (19, 'ARCE CHIHUAN', 'HUMBERTO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA')),
    (20, 'VICHARRA GRANADOS', 'JAVIER MARTIN', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA')),
    (21, 'DE LA CRUZ AVENDAÑO', 'JEAN KEVIN', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA')),
    
    -- TECNICO DE ENFERMERIA
    (22, 'MUÑOZ GARCIA', 'MARLENY YESENIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA')),
    (23, 'LUNA HUAMAN', 'TIFFANY MARLA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA')),
    (24, 'ALARCON YUCRA', 'GOMER CHARO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA')),
    
    -- DIGITADOR ASISTENCIAL
    (25, 'BLAS JARA', 'RICARDO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'DIGITADOR ASISTENCIAL')),
    (26, 'PANIORA RIVERA', 'DIMELSSA ELIZABETH', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'DIGITADOR ASISTENCIAL'));

-- ============================================================================
-- DATOS DE PRUEBA: Adjudicaciones (todos pendientes inicialmente)
-- ============================================================================
INSERT INTO adjudicaciones (postulante_id, estado)
SELECT id, 'pendiente'
FROM postulantes;

-- ============================================================================
-- EJEMPLOS DE ADJUDICACIONES (para testing)
-- ============================================================================
-- Adjudicar algunas plazas para tener datos variados
UPDATE adjudicaciones SET 
    plaza_id = (SELECT id FROM plazas WHERE grupo_ocupacional_id = 
                (SELECT grupo_ocupacional_id FROM postulantes WHERE orden_merito = 1) LIMIT 1),
    estado = 'adjudicado',
    fecha_adjudicacion = CURRENT_TIMESTAMP
WHERE postulante_id = (SELECT id FROM postulantes WHERE orden_merito = 1);

UPDATE adjudicaciones SET 
    plaza_id = (SELECT id FROM plazas WHERE grupo_ocupacional_id = 
                (SELECT grupo_ocupacional_id FROM postulantes WHERE orden_merito = 11) LIMIT 1),
    estado = 'adjudicado',
    fecha_adjudicacion = CURRENT_TIMESTAMP
WHERE postulante_id = (SELECT id FROM postulantes WHERE orden_merito = 11);

-- Marcar algunos como desistido
UPDATE adjudicaciones SET 
    estado = 'desistido',
    fecha_desistimiento = CURRENT_TIMESTAMP,
    observaciones = 'Desistió por motivos personales'
WHERE postulante_id = (SELECT id FROM postulantes WHERE orden_merito = 5);

-- ============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================================================
-- Ver resumen de datos
SELECT 'Redes' AS tabla, COUNT(*) AS cantidad FROM redes
UNION ALL SELECT 'IPRESS', COUNT(*) FROM ipress
UNION ALL SELECT 'Grupos Ocupacionales', COUNT(*) FROM grupos_ocupacionales
UNION ALL SELECT 'Plazas', COUNT(*) FROM plazas
UNION ALL SELECT 'Postulantes', COUNT(*) FROM postulantes
UNION ALL SELECT 'Adjudicaciones', COUNT(*) FROM adjudicaciones;

-- Ver plazas con disponibilidad
SELECT * FROM plazas_con_disponibilidad
ORDER BY red, ipress, grupo_ocupacional;

-- Ver postulantes con estado
SELECT 
    orden_merito,
    apellidos_nombres,
    grupo_ocupacional,
    estado,
    ipress_adjudicada
FROM postulantes_con_estado
ORDER BY orden_merito;

-- Ver estadísticas por estado
SELECT 
    estado,
    COUNT(*) AS cantidad
FROM adjudicaciones
GROUP BY estado
ORDER BY estado;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
