const BaseModel = require('./BaseModel');
const { query, getClient } = require('../config/database');

class Adjudicacion extends BaseModel {
    constructor() {
        super('adjudicaciones');
    }

    /**
     * Realizar adjudicación automática
     */
    async adjudicarAutomatico(postulanteId, plazaId, observaciones = null) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Validar que se puede realizar la adjudicación
            const validacion = await this.validarAdjudicacion(postulanteId, plazaId);
            if (!validacion.valido) {
                throw new Error(validacion.mensaje);
            }
            
            // Verificar si ya existe un registro de adjudicación para el postulante
            const adjudicacionExistente = await client.query(
                'SELECT * FROM adjudicaciones WHERE postulante_id = $1',
                [postulanteId]
            );
            
            let resultado;
            
            if (adjudicacionExistente.rows.length > 0) {
                // Actualizar adjudicación existente
                resultado = await client.query(`
                    UPDATE adjudicaciones 
                    SET plaza_id = $1, 
                        estado = 'adjudicado',
                        fecha_adjudicacion = CURRENT_TIMESTAMP,
                        observaciones = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE postulante_id = $3
                    RETURNING *
                `, [plazaId, observaciones, postulanteId]);
            } else {
                // Crear nueva adjudicación
                resultado = await client.query(`
                    INSERT INTO adjudicaciones (postulante_id, plaza_id, estado, fecha_adjudicacion, observaciones)
                    VALUES ($1, $2, 'adjudicado', CURRENT_TIMESTAMP, $3)
                    RETURNING *
                `, [postulanteId, plazaId, observaciones]);
            }
            
            await client.query('COMMIT');
            return resultado.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Marcar postulante como desistido
     */
    async marcarDesistido(postulanteId, observaciones = null) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Verificar que el postulante existe y está en estado válido para desistir
            const postulante = await client.query(`
                SELECT pos.*, adj.estado 
                FROM postulantes pos 
                LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id 
                WHERE pos.id = $1
            `, [postulanteId]);
            
            if (postulante.rows.length === 0) {
                throw new Error('Postulante no encontrado');
            }
            
            const estadoActual = postulante.rows[0].estado;
            if (estadoActual === 'adjudicado') {
                throw new Error('No se puede marcar como desistido a un postulante ya adjudicado');
            }
            
            // Verificar si ya existe un registro de adjudicación
            const adjudicacionExistente = await client.query(
                'SELECT * FROM adjudicaciones WHERE postulante_id = $1',
                [postulanteId]
            );
            
            let resultado;
            
            if (adjudicacionExistente.rows.length > 0) {
                // Actualizar adjudicación existente
                resultado = await client.query(`
                    UPDATE adjudicaciones 
                    SET estado = 'desistido',
                        fecha_desistimiento = CURRENT_TIMESTAMP,
                        observaciones = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE postulante_id = $2
                    RETURNING *
                `, [observaciones, postulanteId]);
            } else {
                // Crear nueva adjudicación
                resultado = await client.query(`
                    INSERT INTO adjudicaciones (postulante_id, estado, fecha_desistimiento, observaciones)
                    VALUES ($1, 'desistido', CURRENT_TIMESTAMP, $2)
                    RETURNING *
                `, [postulanteId, observaciones]);
            }
            
            await client.query('COMMIT');
            return resultado.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Marcar adjudicación como renuncia
     */
    async marcarRenuncia(postulanteId, observaciones = null) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Verificar que el postulante tiene una adjudicación activa
            const adjudicacion = await client.query(`
                SELECT * FROM adjudicaciones 
                WHERE postulante_id = $1 AND estado = 'adjudicado'
            `, [postulanteId]);
            
            if (adjudicacion.rows.length === 0) {
                throw new Error('No se encontró una adjudicación activa para este postulante');
            }
            
            // Marcar como renuncia
            const resultado = await client.query(`
                UPDATE adjudicaciones 
                SET estado = 'renuncio',
                    fecha_desistimiento = CURRENT_TIMESTAMP,
                    observaciones = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE postulante_id = $2 AND estado = 'adjudicado'
                RETURNING *
            `, [observaciones, postulanteId]);
            
            await client.query('COMMIT');
            return resultado.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Marcar postulante como ausente
     */
    async marcarAusente(postulanteId, observaciones = null) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Verificar que el postulante existe y está en estado pendiente
            const postulante = await client.query(`
                SELECT pos.*, adj.estado 
                FROM postulantes pos 
                LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id 
                WHERE pos.id = $1
            `, [postulanteId]);
            
            if (postulante.rows.length === 0) {
                throw new Error('Postulante no encontrado');
            }
            
            const estadoActual = postulante.rows[0].estado;
            if (estadoActual && estadoActual !== 'pendiente') {
                throw new Error('Solo se puede marcar como ausente a postulantes en estado pendiente');
            }
            
            // Verificar si ya existe un registro de adjudicación
            const adjudicacionExistente = await client.query(
                'SELECT * FROM adjudicaciones WHERE postulante_id = $1',
                [postulanteId]
            );
            
            let resultado;
            
            if (adjudicacionExistente.rows.length > 0) {
                // Actualizar adjudicación existente
                resultado = await client.query(`
                    UPDATE adjudicaciones 
                    SET estado = 'ausente',
                        fecha_desistimiento = CURRENT_TIMESTAMP,
                        observaciones = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE postulante_id = $2
                    RETURNING *
                `, [observaciones, postulanteId]);
            } else {
                // Crear nueva adjudicación
                resultado = await client.query(`
                    INSERT INTO adjudicaciones (postulante_id, estado, fecha_desistimiento, observaciones)
                    VALUES ($1, 'ausente', CURRENT_TIMESTAMP, $2)
                    RETURNING *
                `, [postulanteId, observaciones]);
            }
            
            await client.query('COMMIT');
            return resultado.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reasignar postulante - cambiar estado a pendiente
     */
    async reasignar(postulanteId, observaciones = null) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Verificar que el postulante existe
            const postulante = await client.query(
                'SELECT * FROM postulantes WHERE id = $1',
                [postulanteId]
            );
            
            if (postulante.rows.length === 0) {
                throw new Error('Postulante no encontrado');
            }
            
            // Obtener adjudicación actual
            const adjudicacionActual = await client.query(
                'SELECT * FROM adjudicaciones WHERE postulante_id = $1',
                [postulanteId]
            );
            
            if (adjudicacionActual.rows.length === 0) {
                throw new Error('No hay adjudicación registrada para este postulante');
            }
            
            const estadoActual = adjudicacionActual.rows[0].estado;
            
            // Validar que el estado actual permite reasignar
            if (!['desistido', 'ausente', 'renuncio'].includes(estadoActual)) {
                throw new Error(`No se puede reasignar desde el estado: ${estadoActual}`);
            }
            
            // Cambiar estado a pendiente y limpiar datos de adjudicación
            // Nota: No es necesario actualizar la tabla plazas porque los asignados 
            // se calculan dinámicamente en la vista plazas_con_disponibilidad
            const resultado = await client.query(`
                UPDATE adjudicaciones 
                SET estado = 'pendiente',
                    plaza_id = NULL,
                    fecha_adjudicacion = NULL,
                    fecha_desistimiento = NULL,
                    observaciones = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE postulante_id = $2
                RETURNING *
            `, [observaciones, postulanteId]);
            
            await client.query('COMMIT');
            return resultado.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Validar si se puede realizar una adjudicación
     */
    async validarAdjudicacion(postulanteId, plazaId) {
        try {
            // Usar la función de validación de la base de datos
            const result = await query(
                'SELECT validar_adjudicacion($1, $2) as valido',
                [postulanteId, plazaId]
            );
            
            const valido = result.rows[0].valido;
            
            if (!valido) {
                // Obtener detalles específicos del error
                const detalles = await this.getDetallesValidacion(postulanteId, plazaId);
                return {
                    valido: false,
                    mensaje: detalles.mensaje
                };
            }
            
            return {
                valido: true,
                mensaje: 'Adjudicación válida'
            };
            
        } catch (error) {
            return {
                valido: false,
                mensaje: error.message
            };
        }
    }

    /**
     * Obtener detalles específicos de por qué no es válida una adjudicación
     */
    async getDetallesValidacion(postulanteId, plazaId) {
        // Verificar estado del postulante
        const postulante = await query(`
            SELECT pos.*, adj.estado 
            FROM postulantes pos 
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id 
            WHERE pos.id = $1
        `, [postulanteId]);
        
        if (postulante.rows.length === 0) {
            return { mensaje: 'Postulante no encontrado' };
        }
        
        const estadoPostulante = postulante.rows[0].estado;
        if (estadoPostulante === 'adjudicado') {
            return { mensaje: 'El postulante ya tiene una adjudicación activa' };
        }
        if (estadoPostulante === 'renuncio') {
            return { mensaje: 'El postulante ya renunció a una adjudicación anterior' };
        }
        
        // Verificar disponibilidad de la plaza
        const plazaDisponible = await query(
            'SELECT obtener_plazas_disponibles($1) as disponibles',
            [plazaId]
        );
        
        if (plazaDisponible.rows[0].disponibles <= 0) {
            return { mensaje: 'No hay plazas disponibles en esta posición' };
        }
        
        // Verificar compatibilidad de grupo ocupacional
        const compatibilidad = await query(`
            SELECT 
                pos.grupo_ocupacional_id as postulante_grupo,
                p.grupo_ocupacional_id as plaza_grupo
            FROM postulantes pos, plazas p 
            WHERE pos.id = $1 AND p.id = $2
        `, [postulanteId, plazaId]);
        
        if (compatibilidad.rows.length > 0) {
            const row = compatibilidad.rows[0];
            if (row.postulante_grupo !== row.plaza_grupo) {
                return { mensaje: 'El grupo ocupacional del postulante no coincide con el de la plaza' };
            }
        }
        
        return { mensaje: 'Error desconocido en la validación' };
    }

    /**
     * Obtener adjudicaciones con información completa
     */
    async getAdjudicacionesCompletas(filters = {}) {
        let sql = `
            SELECT 
                adj.*,
                pos.orden_merito,
                pos.apellidos_nombres,
                pos.dni,
                pos.fecha_inicio_contrato,
                go.nombre as grupo_ocupacional,
                p.especialidad,
                i.nombre as ipress_nombre,
                r.nombre as red_nombre
            FROM adjudicaciones adj
            INNER JOIN postulantes pos ON adj.postulante_id = pos.id
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            LEFT JOIN plazas p ON adj.plaza_id = p.id
            LEFT JOIN ipress i ON p.ipress_id = i.id
            LEFT JOIN redes r ON i.red_id = r.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;

        if (filters.estado) {
            paramCount++;
            sql += ` AND adj.estado = $${paramCount}`;
            params.push(filters.estado);
        }

        if (filters.redId) {
            paramCount++;
            sql += ` AND r.id = $${paramCount}`;
            params.push(filters.redId);
        }

        if (filters.grupoOcupacionalId) {
            paramCount++;
            sql += ` AND go.id = $${paramCount}`;
            params.push(filters.grupoOcupacionalId);
        }

        if (filters.fechaDesde) {
            paramCount++;
            sql += ` AND adj.fecha_adjudicacion >= $${paramCount}`;
            params.push(filters.fechaDesde);
        }

        if (filters.fechaHasta) {
            paramCount++;
            sql += ` AND adj.fecha_adjudicacion <= $${paramCount}`;
            params.push(filters.fechaHasta);
        }

        sql += ' ORDER BY adj.fecha_adjudicacion DESC, pos.orden_merito';
        
        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Obtener estadísticas de adjudicaciones
     */
    async getEstadisticas() {
        const sql = `
            SELECT 
                COUNT(*) as total_adjudicaciones,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'adjudicado' THEN 1 END) as adjudicados,
                COUNT(CASE WHEN estado = 'desistido' THEN 1 END) as desistidos,
                COUNT(CASE WHEN estado = 'renuncio' THEN 1 END) as renuncias,
                ROUND(
                    COUNT(CASE WHEN estado = 'adjudicado' THEN 1 END) * 100.0 / 
                    NULLIF(COUNT(*), 0), 2
                ) as porcentaje_adjudicado
            FROM adjudicaciones
        `;
        const result = await query(sql);
        return result.rows[0];
    }

    /**
     * Obtener estadísticas por red
     */
    async getEstadisticasByRed() {
        const sql = `
            SELECT 
                r.nombre as red,
                COUNT(adj.id) as total_adjudicaciones,
                COUNT(CASE WHEN adj.estado = 'adjudicado' THEN 1 END) as adjudicados,
                COUNT(CASE WHEN adj.estado = 'desistido' THEN 1 END) as desistidos,
                COUNT(CASE WHEN adj.estado = 'renuncio' THEN 1 END) as renuncias
            FROM redes r
            LEFT JOIN ipress i ON r.id = i.red_id
            LEFT JOIN plazas p ON i.id = p.ipress_id
            LEFT JOIN adjudicaciones adj ON p.id = adj.plaza_id
            GROUP BY r.id, r.nombre
            ORDER BY r.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Procesar adjudicaciones masivas automáticas
     */
    async procesarAdjudicacionesMasivas(grupoOcupacionalId, cantidad = 10) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Obtener postulantes pendientes ordenados por mérito
            const postulantes = await client.query(`
                SELECT pos.id
                FROM postulantes pos
                LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
                WHERE pos.grupo_ocupacional_id = $1 
                    AND (adj.estado IS NULL OR adj.estado = 'pendiente')
                ORDER BY pos.orden_merito
                LIMIT $2
            `, [grupoOcupacionalId, cantidad]);
            
            // Obtener plazas disponibles para el grupo ocupacional
            const plazas = await client.query(`
                SELECT id FROM plazas_con_disponibilidad 
                WHERE grupo_ocupacional = (
                    SELECT nombre FROM grupos_ocupacionales WHERE id = $1
                ) AND libres > 0
                ORDER BY red, ipress
            `, [grupoOcupacionalId]);
            
            if (plazas.rows.length === 0) {
                throw new Error('No hay plazas disponibles para este grupo ocupacional');
            }
            
            const resultados = [];
            let plazaIndex = 0;
            
            for (const postulante of postulantes.rows) {
                if (plazaIndex >= plazas.rows.length) {
                    break; // No hay más plazas disponibles
                }
                
                const plazaId = plazas.rows[plazaIndex].id;
                
                try {
                    // Verificar si ya existe adjudicación
                    const adjExistente = await client.query(
                        'SELECT * FROM adjudicaciones WHERE postulante_id = $1',
                        [postulante.id]
                    );
                    
                    let resultado;
                    
                    if (adjExistente.rows.length > 0) {
                        // Actualizar adjudicación existente
                        resultado = await client.query(`
                            UPDATE adjudicaciones 
                            SET plaza_id = $1, 
                                estado = 'adjudicado',
                                fecha_adjudicacion = CURRENT_TIMESTAMP,
                                observaciones = 'Adjudicación automática masiva',
                                updated_at = CURRENT_TIMESTAMP
                            WHERE postulante_id = $2
                            RETURNING *
                        `, [plazaId, postulante.id]);
                    } else {
                        // Crear nueva adjudicación
                        resultado = await client.query(`
                            INSERT INTO adjudicaciones (postulante_id, plaza_id, estado, fecha_adjudicacion, observaciones)
                            VALUES ($1, $2, 'adjudicado', CURRENT_TIMESTAMP, 'Adjudicación automática masiva')
                            RETURNING *
                        `, [postulante.id, plazaId]);
                    }
                    
                    resultados.push(resultado.rows[0]);
                    plazaIndex++;
                    
                } catch (error) {
                    console.error(`Error adjudicando postulante ${postulante.id}:`, error.message);
                    // Continuar con el siguiente postulante
                }
            }
            
            await client.query('COMMIT');
            return resultados;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Revertir adjudicación (volver a pendiente)
     */
    async revertirAdjudicacion(adjudicacionId, observaciones = null) {
        const sql = `
            UPDATE adjudicaciones 
            SET estado = 'pendiente',
                plaza_id = NULL,
                fecha_adjudicacion = NULL,
                observaciones = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND estado = 'adjudicado'
            RETURNING *
        `;
        const result = await query(sql, [observaciones, adjudicacionId]);
        
        if (result.rows.length === 0) {
            throw new Error('No se encontró una adjudicación activa para revertir');
        }
        
        return result.rows[0];
    }
}

module.exports = Adjudicacion;