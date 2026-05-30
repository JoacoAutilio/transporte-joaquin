const router = require('express').Router();
const db = require('../db');

// GET /api/cotizar/localidades
router.get('/localidades', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT l.id, l.nombre, l.codigo_postal, p.nombre AS provincia
      FROM localidades l
      JOIN provincias p ON l.provincia_id = p.id
      ORDER BY p.nombre, l.nombre
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cotizar
// Body: { origen_id, destino_id, peso_kg, volumen_m3, tipo_servicio, con_seguro, valor_declarado }
router.post('/', async (req, res) => {
  const { origen_id, destino_id, peso_kg, volumen_m3 = 0, tipo_servicio = 'estandar', con_seguro = false, valor_declarado = 0 } = req.body;

  if (!origen_id || !destino_id || !peso_kg) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: origen_id, destino_id, peso_kg' });
  }
  if (origen_id === destino_id) {
    return res.status(400).json({ error: 'Origen y destino no pueden ser iguales' });
  }

  try {
    const { rows } = await db.query(
      `SELECT * FROM tarifas WHERE origen_id = $1 AND destino_id = $2 AND activo = TRUE LIMIT 1`,
      [origen_id, destino_id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'No hay tarifa disponible para esa ruta' });
    }

    const tarifa = rows[0];

    // Peso efectivo: regla volumétrica 1 m³ = 250 kg
    const peso_efectivo = Math.max(parseFloat(peso_kg), parseFloat(volumen_m3) * 250);

    // Precio base + adicional por kg excedente (sobre 50kg base)
    let precio_base = parseFloat(tarifa.precio_base);
    const excedente = Math.max(0, peso_efectivo - 50);
    precio_base += excedente * parseFloat(tarifa.precio_por_kg);

    // Multiplicadores por tipo de servicio
    const multiplicadores = { estandar: 1, express: 1.35, consolidado: 0.85 };
    const mult = multiplicadores[tipo_servicio] ?? 1;
    precio_base = precio_base * mult;

    // Seguro
    const precio_seguro = con_seguro ? parseFloat(valor_declarado) * 0.012 : 0;
    const precio_total = precio_base + precio_seguro;

    // Plazo
    let plazo_min = tarifa.plazo_dias_min;
    let plazo_max = tarifa.plazo_dias_max;
    if (tipo_servicio === 'express') { plazo_min = 2; plazo_max = 2; }

    res.json({
      tarifa_id: tarifa.id,
      peso_efectivo_kg: Math.round(peso_efectivo * 100) / 100,
      tipo_servicio,
      precio_base: Math.round(precio_base),
      precio_seguro: Math.round(precio_seguro),
      precio_total: Math.round(precio_total),
      plazo_dias: tipo_servicio === 'express' ? '48 hs hábiles' : `${plazo_min}–${plazo_max} días hábiles`,
      moneda: 'ARS',
      iva_incluido: false,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
