const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas requieren auth
router.use(authMiddleware);

// GET /api/tarifas — listar tarifas de la empresa logueada
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM empresas_tarifas
       WHERE empresa_id = $1 ORDER BY origen, destino`,
      [req.empresa.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tarifas — crear tarifa
router.post('/', async (req, res) => {
  const { origen, destino, precio_base, precio_por_kg, plazo_dias_min, plazo_dias_max, descripcion } = req.body;
  if (!origen || !destino || !precio_base) {
    return res.status(400).json({ error: 'origen, destino y precio_base son obligatorios' });
  }
  try {
    // No permitir duplicados origen-destino para la misma empresa
    const { rows: [existe] } = await db.query(
      `SELECT id FROM empresas_tarifas WHERE empresa_id=$1 AND origen=$2 AND destino=$3 AND activo=TRUE`,
      [req.empresa.id, origen, destino]
    );
    if (existe) return res.status(409).json({ error: 'Ya existe una tarifa activa para esa ruta' });

    const { rows: [t] } = await db.query(
      `INSERT INTO empresas_tarifas
         (empresa_id, origen, destino, precio_base, precio_por_kg, plazo_dias_min, plazo_dias_max, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.empresa.id, origen, destino,
       precio_base, precio_por_kg || 0,
       plazo_dias_min || 1, plazo_dias_max || 5,
       descripcion || null]
    );
    res.status(201).json(t);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tarifas/:id — editar tarifa
router.put('/:id', async (req, res) => {
  const { origen, destino, precio_base, precio_por_kg, plazo_dias_min, plazo_dias_max, descripcion, activo } = req.body;
  try {
    // Verificar que la tarifa pertenece a esta empresa
    const { rows: [check] } = await db.query(
      'SELECT id FROM empresas_tarifas WHERE id=$1 AND empresa_id=$2',
      [req.params.id, req.empresa.id]
    );
    if (!check) return res.status(404).json({ error: 'Tarifa no encontrada' });

    const { rows: [t] } = await db.query(
      `UPDATE empresas_tarifas SET
         origen=COALESCE($1,origen), destino=COALESCE($2,destino),
         precio_base=COALESCE($3,precio_base), precio_por_kg=COALESCE($4,precio_por_kg),
         plazo_dias_min=COALESCE($5,plazo_dias_min), plazo_dias_max=COALESCE($6,plazo_dias_max),
         descripcion=COALESCE($7,descripcion), activo=COALESCE($8,activo)
       WHERE id=$9 RETURNING *`,
      [origen, destino, precio_base, precio_por_kg, plazo_dias_min, plazo_dias_max, descripcion, activo, req.params.id]
    );
    res.json(t);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/tarifas/:id — desactivar tarifa
router.delete('/:id', async (req, res) => {
  try {
    const { rows: [check] } = await db.query(
      'SELECT id FROM empresas_tarifas WHERE id=$1 AND empresa_id=$2',
      [req.params.id, req.empresa.id]
    );
    if (!check) return res.status(404).json({ error: 'Tarifa no encontrada' });
    await db.query('UPDATE empresas_tarifas SET activo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
