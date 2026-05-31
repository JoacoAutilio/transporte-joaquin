const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

// POST /api/auth/register — crear empresa con usuario
router.post('/register', async (req, res) => {
  const { nombre, slug, email_admin, password, color_primario, telefono } = req.body;
  if (!nombre || !slug || !email_admin || !password) {
    return res.status(400).json({ error: 'nombre, slug, email_admin y password son obligatorios' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows: [emp] } = await db.query(
      `INSERT INTO empresas (nombre, slug, email_admin, password_hash, color_primario, telefono)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, slug, nombre, email_admin`,
      [nombre, slug.toLowerCase(), email_admin, hash, color_primario || '#E8500A', telefono || null]
    );
    res.status(201).json({ ok: true, empresa: emp });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Slug o email ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  try {
    const { rows: [emp] } = await db.query(
      `SELECT id, slug, nombre, email_admin, password_hash, color_primario
       FROM empresas WHERE email_admin = $1 AND activo = TRUE`,
      [email.toLowerCase().trim()]
    );
    if (!emp) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password, emp.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    // Actualizar último login
    await db.query('UPDATE empresas SET ultimo_login = NOW() WHERE id = $1', [emp.id]);

    const token = jwt.sign(
      { id: emp.id, slug: emp.slug, nombre: emp.nombre },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      empresa: { id: emp.id, slug: emp.slug, nombre: emp.nombre, color_primario: emp.color_primario }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me — info del usuario logueado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows: [emp] } = await db.query(
      `SELECT id, slug, nombre, email_admin, color_primario, color_secundario,
              telefono, logo_url, ultimo_login
       FROM empresas WHERE id = $1`,
      [req.empresa.id]
    );
    res.json(emp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  const { password_actual, password_nuevo } = req.body;
  if (!password_actual || !password_nuevo) return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
  if (password_nuevo.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

  try {
    const { rows: [emp] } = await db.query('SELECT password_hash FROM empresas WHERE id=$1', [req.empresa.id]);
    const ok = await bcrypt.compare(password_actual, emp.password_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(password_nuevo, 12);
    await db.query('UPDATE empresas SET password_hash=$1 WHERE id=$2', [hash, req.empresa.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
