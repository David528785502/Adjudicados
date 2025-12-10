-- ============================================================================
-- SCRIPT PARA ELIMINAR RESTRICCIONES DE ORDEN_MERITO
-- ============================================================================
-- Este script elimina la restricción UNIQUE y CHECK de la columna orden_merito
-- en la tabla postulantes
-- ============================================================================

-- Eliminar la restricción UNIQUE de orden_merito
ALTER TABLE postulantes DROP CONSTRAINT IF EXISTS postulantes_orden_merito_key;

-- Eliminar la restricción CHECK de orden_merito > 0
ALTER TABLE postulantes DROP CONSTRAINT IF EXISTS postulantes_orden_merito_check;

-- Verificar que las restricciones fueron eliminadas
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'postulantes'::regclass
AND conname LIKE '%orden_merito%';

-- Si el resultado está vacío, las restricciones fueron eliminadas correctamente
