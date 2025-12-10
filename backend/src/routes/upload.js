const express = require('express');
const router = express.Router();
const multer = require('multer');
const UploadController = require('../controllers/UploadController');

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos Excel
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

/**
 * POST /api/upload/excel
 * Subir archivo Excel con postulantes y plazas
 */
router.post('/excel', upload.single('file'), UploadController.subirExcel);

module.exports = router;
