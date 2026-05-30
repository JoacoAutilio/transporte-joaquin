const router = require('express').Router();
const db = require('../db');

// POST /api/clientes
router.post('/', async (req, res) => {
  const { razon_social, cuit, email, telefono, direccion, localidad_id } = req.body;
  if (!razon_social || !email) {
    return res.status(400).json({ error: 'razon_social y email son obligatorios' });
  }
  try {
    const { rows: [c] } = await db.query(
      `INSERT INTO clientes (razon_social, cuit, email, telefono, direccion, localidad_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [razon_social, cuit || null, email, telefono || null, direccion || null, localidad_id || null]
    );
    res.status(201).json(c);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'CUIT ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/clientes/:id/envios
router.get('/:id/envios', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.numero_seguimiento, e.estado, e.tipo_servicio,
         e.precio_total, e.fecha_retiro, e.fecha_entrega_estimada,
         lo.nombre AS origen, lp.nombre AS destino
       FROM envios e
       JOIN localidades lo ON e.origen_id = lo.id
       JOIN localidades lp ON e.destino_id = lp.id
       WHERE e.cliente_id = $1
       ORDER BY e.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
