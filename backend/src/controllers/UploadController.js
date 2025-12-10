const XLSX = require('xlsx');
const { pool } = require('../config/database');

class UploadController {
  /**
   * Subir y procesar archivo Excel con postulantes y plazas
   */
  async subirExcel(req, res) {
    const client = await pool.connect();
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha enviado ningún archivo'
        });
      }

      // Leer el archivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

      // Validar que tenga al menos 2 hojas
      if (workbook.SheetNames.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El archivo debe contener al menos 2 hojas: Postulantes y Plazas'
        });
      }

      // Leer las hojas
      const hoja1 = workbook.Sheets[workbook.SheetNames[0]]; // Postulantes
      const hoja2 = workbook.Sheets[workbook.SheetNames[1]]; // Plazas

      // Convertir a JSON
      const postulantesData = XLSX.utils.sheet_to_json(hoja1);
      const plazasData = XLSX.utils.sheet_to_json(hoja2);

      // Validar que no estén vacías
      if (postulantesData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La hoja de Postulantes está vacía'
        });
      }

      if (plazasData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La hoja de Plazas está vacía'
        });
      }

      // Validar postulantes
      const validacionPostulantes = validarPostulantes(postulantesData);
      if (!validacionPostulantes.valido) {
        return res.status(400).json({
          success: false,
          message: validacionPostulantes.mensaje
        });
      }

      // Validar plazas
      const validacionPlazas = validarPlazas(plazasData);
      if (!validacionPlazas.valido) {
        return res.status(400).json({
          success: false,
          message: validacionPlazas.mensaje
        });
      }

      // Obtener el grupo ocupacional de los postulantes (todos deben ser del mismo)
      const grupoOcupacional = postulantesData[0]['Grupo Ocupacional'].toUpperCase().trim();

      // Iniciar transacción
      await client.query('BEGIN');

      // 1. Guardar o verificar grupo ocupacional
      const grupoOcupacionalId = await guardarGrupoOcupacional(client, grupoOcupacional);

      // 2. Guardar postulantes
      const postulanteIds = await guardarPostulantes(client, postulantesData, grupoOcupacionalId);

      // 3. Guardar plazas (incluyendo redes e IPRESS)
      const plazaIds = await guardarPlazas(client, plazasData, grupoOcupacionalId);

      // Commit de la transacción
      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Datos cargados exitosamente',
        data: {
          postulantes: postulanteIds.length,
          plazas: plazaIds.length,
          grupoOcupacional: grupoOcupacional
        }
      });

    } catch (error) {
      // Rollback en caso de error
      await client.query('ROLLBACK');
      console.error('Error al procesar Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar el archivo Excel',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
}

/**
 * Validar datos de postulantes
 */
function validarPostulantes(postulantes) {
    const omsVistos = new Set();
    const gruposOcupacionales = new Set();

    for (let i = 0; i < postulantes.length; i++) {
      const fila = i + 2; // +2 porque la fila 1 es encabezado y Excel empieza en 1
      const p = postulantes[i];

      // Validar que existan todas las columnas requeridas
      if (!p['OM'] && p['OM'] !== 0) {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Postulantes): Falta el Orden de Mérito (OM)`
        };
      }

      if (!p['Apellidos'] || p['Apellidos'].toString().trim() === '') {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Postulantes): Falta Apellidos`
        };
      }

      if (!p['Nombres'] || p['Nombres'].toString().trim() === '') {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Postulantes): Falta Nombres`
        };
      }

      if (!p['Grupo Ocupacional'] || p['Grupo Ocupacional'].toString().trim() === '') {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Postulantes): Falta Grupo Ocupacional`
        };
      }

      // Validar que OM sea un número
      const om = Number(p['OM']);
      if (isNaN(om) || om <= 0) {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Postulantes): El OM debe ser un número mayor a 0`
        };
      }

      // Validar que OM no se repita en este archivo
      if (omsVistos.has(om)) {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Postulantes): El OM ${om} está duplicado en el archivo`
        };
      }
      omsVistos.add(om);

      // Validar que todos tengan el mismo grupo ocupacional
      const grupoOcupacional = p['Grupo Ocupacional'].toUpperCase().trim();
      gruposOcupacionales.add(grupoOcupacional);
    }

    // Validar que todos los postulantes sean del mismo grupo ocupacional
    if (gruposOcupacionales.size > 1) {
      return {
        valido: false,
        mensaje: `Todos los postulantes deben ser del mismo Grupo Ocupacional. Se encontraron: ${Array.from(gruposOcupacionales).join(', ')}`
      };
    }

    return { valido: true };
  }



/**
 * Validar datos de plazas
 */
function validarPlazas(plazas) {
    for (let i = 0; i < plazas.length; i++) {
      const fila = i + 2;
      const p = plazas[i];

      // Validar columnas requeridas
      if (!p['red'] || p['red'].toString().trim() === '') {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Plazas): Falta Red`
        };
      }

      if (!p['ipress'] || p['ipress'].toString().trim() === '') {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Plazas): Falta IPRESS`
        };
      }

      // sub unidad puede estar vacía, se reemplazará por "-"

      if (!p['cant. Plazas'] && p['cant. Plazas'] !== 0) {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Plazas): Falta Cantidad de Plazas`
        };
      }

      // Validar que cant. Plazas sea un número entero positivo
      const cantidad = Number(p['cant. Plazas']);
      if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
        return {
          valido: false,
          mensaje: `Fila ${fila} (Plazas): La Cantidad de Plazas debe ser un número entero mayor a 0`
        };
      }
    }

    return { valido: true };
  }



/**
 * Guardar o verificar grupo ocupacional
 */
async function guardarGrupoOcupacional(client, nombre) {
    const nombreMayuscula = nombre.toUpperCase().trim();

    // Verificar si existe
    const resultadoBusqueda = await client.query(
      'SELECT id FROM grupos_ocupacionales WHERE UPPER(nombre) = $1',
      [nombreMayuscula]
    );

    if (resultadoBusqueda.rows.length > 0) {
      return resultadoBusqueda.rows[0].id;
    }

    // Insertar nuevo grupo ocupacional
    const resultadoInsert = await client.query(
      'INSERT INTO grupos_ocupacionales (nombre) VALUES ($1) RETURNING id',
      [nombreMayuscula]
    );

    return resultadoInsert.rows[0].id;
  }



/**
 * Guardar postulantes
 */
async function guardarPostulantes(client, postulantes, grupoOcupacionalId) {
    const ids = [];

    for (const p of postulantes) {
      const om = Number(p['OM']);
      const apellidos = p['Apellidos'].toString().toUpperCase().trim();
      const nombres = p['Nombres'].toString().toUpperCase().trim();

      // Insertar postulante
      const resultado = await client.query(
        `INSERT INTO postulantes (orden_merito, apellidos, nombres, grupo_ocupacional_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [om, apellidos, nombres, grupoOcupacionalId]
      );

      const postulanteId = resultado.rows[0].id;
      ids.push(postulanteId);

      // Crear registro de adjudicación con estado pendiente
      await client.query(
        `INSERT INTO adjudicaciones (postulante_id, estado)
         VALUES ($1, 'pendiente')`,
        [postulanteId]
      );
    }

    return ids;
  }



/**
 * Guardar o verificar red
 */
async function guardarRed(client, nombre) {
    const nombreMayuscula = nombre.toUpperCase().trim();

    // Verificar si existe
    const resultadoBusqueda = await client.query(
      'SELECT id FROM redes WHERE UPPER(nombre) = $1',
      [nombreMayuscula]
    );

    if (resultadoBusqueda.rows.length > 0) {
      return resultadoBusqueda.rows[0].id;
    }

    // Insertar nueva red
    const resultadoInsert = await client.query(
      'INSERT INTO redes (nombre) VALUES ($1) RETURNING id',
      [nombreMayuscula]
    );

    return resultadoInsert.rows[0].id;
}

/**
 * Guardar o verificar IPRESS
 */
async function guardarIpress(client, nombre, redId) {
    const nombreMayuscula = nombre.toUpperCase().trim();

    // Verificar si existe
    const resultadoBusqueda = await client.query(
      'SELECT id FROM ipress WHERE UPPER(nombre) = $1 AND red_id = $2',
      [nombreMayuscula, redId]
    );

    if (resultadoBusqueda.rows.length > 0) {
      return resultadoBusqueda.rows[0].id;
    }

    // Insertar nueva IPRESS
    const resultadoInsert = await client.query(
      'INSERT INTO ipress (red_id, nombre) VALUES ($1, $2) RETURNING id',
      [redId, nombreMayuscula]
    );

    return resultadoInsert.rows[0].id;
}

/**
 * Guardar plazas
 */
async function guardarPlazas(client, plazas, grupoOcupacionalId) {
    const ids = [];

    for (const p of plazas) {
      const redNombre = p['red'].toString().trim();
      const ipressNombre = p['ipress'].toString().trim();
      const subunidad = p['sub unidad'] ? p['sub unidad'].toString().toUpperCase().trim() : '-';
      const cantidad = Number(p['cant. Plazas']);

      // Guardar o verificar red
      const redId = await guardarRed(client, redNombre);

      // Guardar o verificar IPRESS
      const ipressId = await guardarIpress(client, ipressNombre, redId);

      // Verificar si ya existe la plaza
      const plazaExistente = await client.query(
        `SELECT id FROM plazas 
         WHERE ipress_id = $1 
         AND grupo_ocupacional_id = $2 
         AND subunidad = $3 
         AND (especialidad IS NULL OR especialidad = '')`,
        [ipressId, grupoOcupacionalId, subunidad]
      );

      let plazaId;
      if (plazaExistente.rows.length > 0) {
        // Si ya existe, usar el ID existente
        plazaId = plazaExistente.rows[0].id;
      } else {
        // Si no existe, insertar nueva plaza
        const resultado = await client.query(
          `INSERT INTO plazas (ipress_id, grupo_ocupacional_id, subunidad, especialidad, total)
           VALUES ($1, $2, $3, NULL, $4)
           RETURNING id`,
          [ipressId, grupoOcupacionalId, subunidad, cantidad]
        );
        plazaId = resultado.rows[0].id;
      }

      ids.push(plazaId);
    }

    return ids;
}

module.exports = new UploadController();
