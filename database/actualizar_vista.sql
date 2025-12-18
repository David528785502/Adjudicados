-- Script para actualizar la vista plazas_con_disponibilidad
-- Agregar la columna grupo_ocupacional con el nombre del grupo

CREATE OR REPLACE VIEW plazas_con_disponibilidad AS
SELECT 
    p.id,
    r.id AS red_id,
    r.nombre AS red,
    i.id AS ipress_id,
    i.nombre AS ipress,
    go.id AS grupo_ocupacional_id,
    go.nombre AS grupo_ocupacional,
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
GROUP BY p.id, r.id, r.nombre, i.id, i.nombre, go.id, go.nombre, p.subunidad, p.especialidad, p.total;

-- Verificar que la vista funcione correctamente
SELECT COUNT(*) as total_plazas FROM plazas_con_disponibilidad;
SELECT COUNT(*) as total_plazas_tabla FROM plazas;
