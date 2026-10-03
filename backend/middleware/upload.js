const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Solo imágenes rasterizadas (SVG queda afuera: puede llevar scripts)
const EXTENSIONES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `foto-${Date.now()}-${rand}${EXTENSIONES[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) cb(null, true);
    else cb(new Error('Formato no permitido. Subí una imagen JPG, PNG, WEBP, GIF o HEIC.'));
  },
});

// Middleware para un campo "foto" que responde 400 con un mensaje claro si multer falla
const uploadFoto = (req, res, next) => {
  upload.single('foto')(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La foto no puede superar los 5 MB' : err.message;
    res.status(400).json({ error: msg });
  });
};

// Borra el archivo subido si algo falla después de recibirlo
const descartarArchivo = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

module.exports = { uploadFoto, descartarArchivo, uploadsDir };
