-- ============================================================================
-- ACTUALIZAR VISTA: postulantes_con_estado
-- Ejecuta este script en tu base de datos PostgreSQL
-- ============================================================================

-- Primero, ver la definición actual de la vista
SELECT pg_get_viewdef('postulantes_con_estado', true);

-- Actualizar la vista con el campo especialidad
CREATE OR REPLACE VIEW postulantes_con_estado AS
SELECT 
    p.id,
    p.orden_merito,
    CONCAT(p.apellidos, ' ', p.nombres) AS apellidos_nombres,
    p.apellidos,
    p.nombres,
    p.grupo_ocupacional_id,
    go.nombre AS grupo_ocupacional,
    p.especialidad,
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

-- Verificar que la vista incluye la especialidad
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'postulantes_con_estado' 
ORDER BY ordinal_position;

-- Ver datos de prueba con especialidad
SELECT 
    orden_merito,
    apellidos_nombres,
    grupo_ocupacional,
    especialidad,
    estado
FROM postulantes_con_estado
WHERE especialidad IS NOT NULL
LIMIT 5;
