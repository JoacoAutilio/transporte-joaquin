const router = require('express').Router();
const db = require('../db');

router.get('/:slug/config', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const { rows: [empresa] } = await db.query(
      `SELECT id, nombre, slug, color_primario, color_secundario, logo_url, telefono, email
       FROM empresas WHERE slug = $1 AND activo = TRUE`,
      [req.params.slug]
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    const { rows: tarifas } = await db.query(
      `SELECT DISTINCT origen, destino FROM empresas_tarifas
       WHERE empresa_id = $1 AND activo = TRUE ORDER BY origen, destino`,
      [empresa.id]
    );
    const origenes = [...new Set(tarifas.map(t => t.origen))];
    res.json({ empresa, origenes, tarifas });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:slug/cotizar', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  const { origen, destino, peso_kg, volumen_m3 = 0, tipo_servicio = 'estandar' } = req.body;
  if (!origen || !destino || !peso_kg) return res.status(400).json({ error: 'Faltan campos: origen, destino, peso_kg' });
  try {
    const { rows: [empresa] } = await db.query('SELECT id FROM empresas WHERE slug = $1 AND activo = TRUE', [req.params.slug]);
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
    const { rows: [tarifa] } = await db.query(
      `SELECT * FROM empresas_tarifas WHERE empresa_id = $1 AND origen = $2 AND destino = $3 AND activo = TRUE`,
      [empresa.id, origen, destino]
    );
    if (!tarifa) return res.status(404).json({ error: 'No hay tarifa para esa ruta' });
    const peso_efectivo = Math.max(parseFloat(peso_kg), parseFloat(volumen_m3) * 250);
    let precio = parseFloat(tarifa.precio_base);
    precio += Math.max(0, peso_efectivo - 50) * parseFloat(tarifa.precio_por_kg);
    precio = Math.round(precio * ({ estandar: 1, express: 1.35, consolidado: 0.85 }[tipo_servicio] ?? 1));
    const plazo = tipo_servicio === 'express' ? '48 hs hábiles' : `${tarifa.plazo_dias_min}–${tarifa.plazo_dias_max} días hábiles`;
    res.json({ precio_total: precio, plazo, peso_efectivo_kg: Math.round(peso_efectivo * 10) / 10, tipo_servicio, moneda: 'ARS', iva_incluido: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.options('/:slug/cotizar', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = router;
