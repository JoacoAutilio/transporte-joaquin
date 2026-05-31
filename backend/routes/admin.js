const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas del panel admin requieren JWT válido
router.use(authMiddleware);

// ── VEHÍCULOS ──────────────────────────────────────────────────

router.get('/vehiculos', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.*, c.nombre||' '||c.apellido AS chofer_asignado
       FROM vehiculos v LEFT JOIN choferes c ON c.vehiculo_id = v.id
       WHERE v.empresa_id=$1 ORDER BY v.created_at DESC`,
      [req.empresa.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/vehiculos', async (req, res) => {
  const { patente, marca, modelo, tipo = 'camion', año } = req.body;
  if (!patente || !marca || !modelo) return res.status(400).json({ error: 'patente, marca y modelo son obligatorios' });
  try {
    const { rows: [v] } = await db.query(
      `INSERT INTO vehiculos (empresa_id, patente, marca, modelo, tipo, año)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.empresa.id, patente.toUpperCase(), marca, modelo, tipo, año || null]
    );
    res.status(201).json(v);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/vehiculos/:id', async (req, res) => {
  const { patente, marca, modelo, tipo, año, activo } = req.body;
  try {
    const { rows: [v] } = await db.query(
      `UPDATE vehiculos SET
         patente=COALESCE($1,patente), marca=COALESCE($2,marca),
         modelo=COALESCE($3,modelo), tipo=COALESCE($4,tipo),
         año=COALESCE($5,año), activo=COALESCE($6,activo)
       WHERE id=$7 AND empresa_id=$8 RETURNING *`,
      [patente?.toUpperCase(), marca, modelo, tipo, año, activo, req.params.id, req.empresa.id]
    );
    if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(v);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/vehiculos/:id', async (req, res) => {
  try {
    await db.query('UPDATE vehiculos SET activo=FALSE WHERE id=$1 AND empresa_id=$2', [req.params.id, req.empresa.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CHOFERES ───────────────────────────────────────────────────

router.get('/choferes', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, v.patente||' '||v.marca||' '||v.modelo AS vehiculo_info
       FROM choferes c LEFT JOIN vehiculos v ON c.vehiculo_id = v.id
       WHERE c.empresa_id=$1 AND c.activo=TRUE ORDER BY c.apellido`,
      [req.empresa.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/choferes', async (req, res) => {
  const { nombre, apellido, dni, telefono, email, vehiculo_id } = req.body;
  if (!nombre || !apellido || !dni) return res.status(400).json({ error: 'nombre, apellido y dni son obligatorios' });
  try {
    const { rows: [c] } = await db.query(
      `INSERT INTO choferes (empresa_id, nombre, apellido, dni, telefono, email, vehiculo_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.empresa.id, nombre, apellido, dni, telefono || null, email || null, vehiculo_id || null]
    );
    res.status(201).json(c);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'DNI ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/choferes/:id', async (req, res) => {
  const { nombre, apellido, dni, telefono, email, vehiculo_id, activo } = req.body;
  try {
    const { rows: [c] } = await db.query(
      `UPDATE choferes SET
         nombre=COALESCE($1,nombre), apellido=COALESCE($2,apellido),
         dni=COALESCE($3,dni), telefono=COALESCE($4,telefono),
         email=COALESCE($5,email), vehiculo_id=COALESCE($6,vehiculo_id),
         activo=COALESCE($7,activo)
       WHERE id=$8 AND empresa_id=$9 RETURNING *`,
      [nombre, apellido, dni, telefono, email, vehiculo_id, activo, req.params.id, req.empresa.id]
    );
    if (!c) return res.status(404).json({ error: 'Chofer no encontrado' });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/choferes/:id', async (req, res) => {
  try {
    await db.query('UPDATE choferes SET activo=FALSE WHERE id=$1 AND empresa_id=$2', [req.params.id, req.empresa.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ESTADÍSTICAS ───────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [rutas, totales, choferes, vehiculos] = await Promise.all([
      db.query(
        `SELECT origen, destino, COUNT(*) AS cantidad, SUM(precio_total) AS ingresos_totales
         FROM widget_envios WHERE empresa_id=$1
         GROUP BY origen, destino ORDER BY cantidad DESC LIMIT 10`,
        [req.empresa.id]
      ),
      db.query(
        `SELECT COUNT(*) AS total_envios,
           COALESCE(SUM(precio_total),0) AS ingresos_totales,
           COALESCE(AVG(precio_total),0) AS ticket_promedio
         FROM widget_envios WHERE empresa_id=$1`,
        [req.empresa.id]
      ),
      db.query('SELECT COUNT(*) AS total FROM choferes WHERE empresa_id=$1 AND activo=TRUE', [req.empresa.id]),
      db.query('SELECT COUNT(*) AS total FROM vehiculos WHERE empresa_id=$1 AND activo=TRUE', [req.empresa.id]),
    ]);
    res.json({
      rutas: rutas.rows,
      totales: totales.rows[0],
      choferes_activos: choferes.rows[0].total,
      vehiculos_activos: vehiculos.rows[0].total,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
