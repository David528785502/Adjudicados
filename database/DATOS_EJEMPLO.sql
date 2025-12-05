-- ============================================================================
-- DATOS DE EJEMPLO PARA PRUEBAS
-- Sistema de Adjudicación de Plazas - EsSalud
-- ============================================================================
-- IMPORTANTE: Ejecuta SCRIPT_COMPLETO_BD.sql primero
-- Luego ejecuta este archivo para cargar datos de prueba
-- ============================================================================

-- ============================================================================
-- INSERTAR IPRESS
-- ============================================================================

-- IPRESS para RED TACNA
INSERT INTO ipress (red_id, nombre) VALUES 
    ((SELECT id FROM redes WHERE nombre = 'RED TACNA'), 'HOSPITAL HIPOLITO UNANUE'),
    ((SELECT id FROM redes WHERE nombre = 'RED TACNA'), 'CAP METROPOLITANO'),
    ((SELECT id FROM redes WHERE nombre = 'RED TACNA'), 'POLICLINICO BOLOGNESI')
ON CONFLICT (red_id, nombre) DO NOTHING;

-- IPRESS para GOF
INSERT INTO ipress (red_id, nombre) VALUES 
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'CEPRIT'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'CRUEN'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SG ATENCION DOMICILIARIA'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SG STAE'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SGPE-DIRECCIÓN HOSPITAL PERU'),
    ((SELECT id FROM redes WHERE nombre = 'GOF'), 'SGPE-DIRECCIÓN PROYECTOS ESPECIALES')
ON CONFLICT (red_id, nombre) DO NOTHING;

-- IPRESS para CENATE
INSERT INTO ipress (red_id, nombre) VALUES 
    ((SELECT id FROM redes WHERE nombre = 'CENATE'), 'CENATE - NIVEL RED')
ON CONFLICT (red_id, nombre) DO NOTHING;

-- ============================================================================
-- INSERTAR PLAZAS (con subunidad)
-- ============================================================================

-- Plazas RED TACNA
INSERT INTO plazas (ipress_id, grupo_ocupacional_id, subunidad, especialidad, total) VALUES
    (
        (SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'),
        'Emergencia',
        'ENFERMERA I - EMERGENCIA',
        5
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'),
        'UCI',
        'ENFERMERA I - UCI',
        3
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'),
        'Consulta Externa',
        NULL,
        8
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'HOSPITAL HIPOLITO UNANUE' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA'),
        'Hospitalización',
        NULL,
        10
    );

-- Plazas GOF - CEPRIT
INSERT INTO plazas (ipress_id, grupo_ocupacional_id, subunidad, especialidad, total) VALUES
    (
        (SELECT id FROM ipress WHERE nombre = 'CEPRIT' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'DIGITADOR ASISTENCIAL'),
        NULL,
        NULL,
        4
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'CEPRIT' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'),
        'Atención COVID',
        NULL,
        10
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'CEPRIT' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'),
        NULL,
        NULL,
        3
    );

-- Plazas GOF - SG ATENCION DOMICILIARIA
INSERT INTO plazas (ipress_id, grupo_ocupacional_id, subunidad, especialidad, total) VALUES
    (
        (SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA'),
        'Unidad Móvil',
        NULL,
        55
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'),
        'Atención Domiciliaria',
        NULL,
        25
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'),
        'Atención Domiciliaria',
        NULL,
        40
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'SG ATENCION DOMICILIARIA' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'PSICOLOGO'),
        'Salud Mental',
        NULL,
        2
    );

-- Plazas CENATE
INSERT INTO plazas (ipress_id, grupo_ocupacional_id, subunidad, especialidad, total) VALUES
    (
        (SELECT id FROM ipress WHERE nombre = 'CENATE - NIVEL RED' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICO ESPECIALISTA'),
        'Cardiología',
        'CARDIOLOGIA',
        1
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'CENATE - NIVEL RED' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'),
        'Hospitalización',
        NULL,
        11
    ),
    (
        (SELECT id FROM ipress WHERE nombre = 'CENATE - NIVEL RED' LIMIT 1),
        (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'),
        'Consulta Externa',
        NULL,
        36
    );

-- ============================================================================
-- INSERTAR POSTULANTES
-- ============================================================================

-- Postulantes ENFERMERA
INSERT INTO postulantes (orden_merito, apellidos_nombres, grupo_ocupacional_id, dni, fecha_inicio_contrato) VALUES
    (1, 'SILVA LOPEZ MARIA DEFILIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '12345678', '2024-01-15'),
    (2, 'ANCHELIA OSCATE NILDA GUIULIANA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '23456789', '2024-02-01'),
    (3, 'MOLERO ESCOBAR FATIMA VIVIANA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '34567890', '2024-01-20'),
    (4, 'FLORES PONCE CLAUDIA GABRIELA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '45678901', '2024-02-10'),
    (5, 'QUESQUEN MILLONES KARLA GUILIANA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '56789012', '2024-01-25'),
    (6, 'GONZALES GOMEZ LILIANA MILAGROS', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '67890123', '2024-02-15'),
    (7, 'COLQUEHUANCA USEDO YENIFER', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '78901234', '2024-01-30'),
    (8, 'CASTILLO PEREDA LUZ VIRGINIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '89012345', '2024-02-05'),
    (9, 'AREVALO LOPEZ KELLY GISELL', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '90123456', '2024-01-18'),
    (10, 'BLANCO JULIAN CANDY VALERIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'ENFERMERA'), '01234567', '2024-02-20');

-- Postulantes MEDICOS
INSERT INTO postulantes (orden_merito, apellidos_nombres, grupo_ocupacional_id, dni, fecha_inicio_contrato) VALUES
    (1, 'AREVALO ROMERO ZURISADAISI', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '11223344', '2024-01-15'),
    (2, 'HOYOS PASTOR RAQUEL', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '22334455', '2024-02-01'),
    (3, 'CABREJOS ARELLANO LUZ KATHERINE', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '33445566', '2024-01-20'),
    (4, 'VELAZCO ZUTA RENAN RICARDO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '44556677', '2024-02-10'),
    (5, 'ALEGRIA CACERES CYNTHIA FRANCESCA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '55667788', '2024-01-25'),
    (6, 'PEREZ MENDOZA VIRGINIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '66778899', '2024-02-15'),
    (7, 'ROMAN SANTILLAN GIANMARCO MANUEL', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '77889900', '2024-01-30'),
    (8, 'ALATRISTA VALDEZ FLAVIA ANDREA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'MEDICOS'), '88990011', '2024-02-05');

-- Postulantes CONDUCTOR DE AMBULANCIA
INSERT INTO postulantes (orden_merito, apellidos_nombres, grupo_ocupacional_id, dni, fecha_inicio_contrato) VALUES
    (1, 'ARCE CHIHUAN HUMBERTO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA'), '11112222', '2024-01-15'),
    (2, 'VICHARRA GRANADOS JAVIER MARTIN', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA'), '22223333', '2024-02-01'),
    (3, 'DE LA CRUZ AVENDAÑO JEAN KEVIN', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'CONDUCTOR DE AMBULANCIA'), '33334444', '2024-01-20');

-- Postulantes TECNICO DE ENFERMERIA
INSERT INTO postulantes (orden_merito, apellidos_nombres, grupo_ocupacional_id, dni, fecha_inicio_contrato) VALUES
    (1, 'MUÑOZ GARCIA MARLENY YESENIA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA'), '44445555', '2024-01-15'),
    (2, 'LUNA HUAMAN TIFFANY MARLA', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA'), '55556666', '2024-02-01'),
    (3, 'ALARCON YUCRA GOMER CHARO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'TECNICO DE ENFERMERIA'), '66667777', '2024-01-20');

-- Postulantes DIGITADOR ASISTENCIAL
INSERT INTO postulantes (orden_merito, apellidos_nombres, grupo_ocupacional_id, dni, fecha_inicio_contrato) VALUES
    (1, 'BLAS JARA RICARDO', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'DIGITADOR ASISTENCIAL'), '77778888', '2024-01-15'),
    (2, 'PANIORA RIVERA DIMELSSA ELIZABETH', (SELECT id FROM grupos_ocupacionales WHERE nombre = 'DIGITADOR ASISTENCIAL'), '88889999', '2024-02-01');

-- ============================================================================
-- CREAR REGISTROS DE ADJUDICACIONES (todos en estado pendiente)
-- ============================================================================

INSERT INTO adjudicaciones (postulante_id, estado)
SELECT id, 'pendiente'
FROM postulantes;

-- ============================================================================
-- VERIFICACIÓN DE DATOS CARGADOS
-- ============================================================================

-- Resumen de datos
SELECT 'Redes' AS tabla, COUNT(*) AS cantidad FROM redes
UNION ALL
SELECT 'IPRESS', COUNT(*) FROM ipress
UNION ALL
SELECT 'Grupos Ocupacionales', COUNT(*) FROM grupos_ocupacionales
UNION ALL
SELECT 'Plazas', COUNT(*) FROM plazas
UNION ALL
SELECT 'Postulantes', COUNT(*) FROM postulantes
UNION ALL
SELECT 'Adjudicaciones', COUNT(*) FROM adjudicaciones;

-- Ver plazas con disponibilidad
SELECT * FROM plazas_con_disponibilidad
ORDER BY red, ipress, grupo_ocupacional;

-- Ver postulantes por grupo
SELECT 
    go.nombre AS grupo_ocupacional,
    COUNT(*) AS total_postulantes
FROM postulantes p
INNER JOIN grupos_ocupacionales go ON p.grupo_ocupacional_id = go.id
GROUP BY go.nombre
ORDER BY go.nombre;

-- ============================================================================
-- FIN DEL SCRIPT DE DATOS
-- ============================================================================
