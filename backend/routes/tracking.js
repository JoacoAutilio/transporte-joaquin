const router = require('express').Router();
const db = require('../db');

// GET /api/tracking/:numero
router.get('/:numero', async (req, res) => {
  try {
    const { rows: [envio] } = await db.query(
      `SELECT e.id, e.numero_seguimiento, e.estado, e.fecha_retiro,
         e.fecha_entrega_estimada, e.fecha_entrega_real,
         e.tipo_servicio, e.peso_efectivo_kg,
         lo.nombre AS origen, lp.nombre AS destino
       FROM envios e
       JOIN localidades lo ON e.origen_id = lo.id
       JOIN localidades lp ON e.destino_id = lp.id
       WHERE e.numero_seguimiento = $1`,
      [req.params.numero.toUpperCase()]
    );

    if (!envio) return res.status(404).json({ error: 'Número de seguimiento no encontrado' });

    const { rows: eventos } = await db.query(
      `SELECT estado, descripcion, ubicacion, fecha
       FROM tracking WHERE envio_id = $1 ORDER BY fecha ASC`,
      [envio.id]
    );

    res.json({ envio, eventos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
