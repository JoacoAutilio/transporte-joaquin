const router = require('express').Router();
const db = require('../db');

// Genera número de seguimiento tipo TJ-2025-XXXXXX
function generarSeguimiento() {
  const año = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TJ-${año}-${rand}`;
}

// POST /api/envios — crear envío desde cotización confirmada
router.post('/', async (req, res) => {
  const {
    cliente_id, origen_id, destino_id, tarifa_id,
    tipo_servicio = 'estandar', peso_kg, volumen_m3 = 0,
    valor_declarado = 0, con_seguro = false,
    descripcion_carga, fecha_retiro,
  } = req.body;

  if (!cliente_id || !origen_id || !destino_id || !peso_kg) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Recalcular precio (no confiar en frontend)
    const { rows: [tarifa] } = await client.query(
      'SELECT * FROM tarifas WHERE id = $1 AND activo = TRUE', [tarifa_id]
    );
    if (!tarifa) throw new Error('Tarifa inválida');

    const peso_efectivo = Math.max(parseFloat(peso_kg), parseFloat(volumen_m3) * 250);
    let precio_base = parseFloat(tarifa.precio_base);
    precio_base += Math.max(0, peso_efectivo - 50) * parseFloat(tarifa.precio_por_kg);
    const mult = { estandar: 1, express: 1.35, consolidado: 0.85 }[tipo_servicio] ?? 1;
    precio_base = Math.round(precio_base * mult);
    const precio_seguro = con_seguro ? Math.round(parseFloat(valor_declarado) * 0.012) : 0;
    const precio_total = precio_base + precio_seguro;

    // Fecha estimada de entrega
    const diasMin = tipo_servicio === 'express' ? 2 : tarifa.plazo_dias_min;
    const fechaEntrega = fecha_retiro
      ? new Date(new Date(fecha_retiro).getTime() + diasMin * 86400000)
      : null;

    const numero = generarSeguimiento();

    const { rows: [envio] } = await client.query(
      `INSERT INTO envios
         (numero_seguimiento, cliente_id, origen_id, destino_id, tarifa_id,
          tipo_servicio, peso_kg, volumen_m3, peso_efectivo_kg,
          valor_declarado, con_seguro, precio_base, precio_seguro, precio_total,
          descripcion_carga, fecha_retiro, fecha_entrega_estimada, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'confirmado')
       RETURNING *`,
      [numero, cliente_id, origen_id, destino_id, tarifa_id,
       tipo_servicio, peso_kg, volumen_m3, peso_efectivo,
       valor_declarado, con_seguro, precio_base, precio_seguro, precio_total,
       descripcion_carga, fecha_retiro, fechaEntrega]
    );

    // Primer evento de tracking
    await client.query(
      `INSERT INTO tracking (envio_id, estado, descripcion) VALUES ($1, 'confirmado', 'Envío confirmado y pendiente de retiro')`,
      [envio.id]
    );

    await client.query('COMMIT');
    res.status(201).json(envio);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// GET /api/envios/:numero — detalle por número de seguimiento
router.get('/:numero', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*,
         c.razon_social AS cliente_nombre,
         lo.nombre AS origen_nombre, lp.nombre AS destino_nombre
       FROM envios e
       JOIN clientes c ON e.cliente_id = c.id
       JOIN localidades lo ON e.origen_id = lo.id
       JOIN localidades lp ON e.destino_id = lp.id
       WHERE e.numero_seguimiento = $1`,
      [req.params.numero.toUpperCase()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/envios/:id/estado — actualizar estado (uso interno/admin)
router.patch('/:id/estado', async (req, res) => {
  const { estado, descripcion, ubicacion } = req.body;
  const estados_validos = ['confirmado','en_transito','en_destino','entregado','cancelado'];
  if (!estados_validos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const updates = { estado };
    if (estado === 'entregado') updates.fecha_entrega_real = 'NOW()';

    await client.query(
      `UPDATE envios SET estado = $1 ${estado === 'entregado' ? ', fecha_entrega_real = NOW()' : ''} WHERE id = $2`,
      [estado, req.params.id]
    );
    await client.query(
      `INSERT INTO tracking (envio_id, estado, descripcion, ubicacion) VALUES ($1,$2,$3,$4)`,
      [req.params.id, estado, descripcion || estado, ubicacion || null]
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
