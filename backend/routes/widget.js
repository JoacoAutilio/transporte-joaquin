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
  if (!origen || !destino || !peso_kg) {
    return res.status(400).json({ error: 'Faltan campos: origen, destino, peso_kg' });
  }

  try {
    const { rows: [empresa] } = await db.query(
      'SELECT id FROM empresas WHERE slug = $1 AND activo = TRUE',
      [req.params.slug]
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });

    // Extraer provincia del formato "Ciudad (Provincia)"
    function extraerProvincia(str) {
      const match = str.match(/\(([^)]+)\)$/);
      return match ? match[1].trim() : str.trim();
    }

    const provOrigen  = extraerProvincia(origen);
    const provDestino = extraerProvincia(destino);

    // Buscar tarifa por provincia (ignora la ciudad)
    const { rows: [tarifa] } = await db.query(
      `SELECT * FROM empresas_tarifas
       WHERE empresa_id = $1
         AND activo = TRUE
         AND (
           -- Buscar coincidencia exacta primero
           (origen = $2 AND destino = $3)
           OR
           -- Buscar por provincia extraída
           (origen ILIKE $4 AND destino ILIKE $5)
           OR
           -- Buscar si el origen/destino guardado contiene la provincia
           (origen ILIKE $6 AND destino ILIKE $7)
         )
       ORDER BY
         CASE WHEN origen = $2 AND destino = $3 THEN 0 ELSE 1 END
       LIMIT 1`,
      [empresa.id, origen, destino,
       provOrigen, provDestino,
       '%' + provOrigen + '%', '%' + provDestino + '%']
    );

    if (!tarifa) {
      return res.status(404).json({
        error: `No hay tarifa disponible para la ruta ${provOrigen} → ${provDestino}. Contactá a la empresa.`
      });
    }

    const peso_efectivo = Math.max(parseFloat(peso_kg), parseFloat(volumen_m3) * 250);
    let precio = parseFloat(tarifa.precio_base);
    precio += Math.max(0, peso_efectivo - 50) * parseFloat(tarifa.precio_por_kg);
    precio = Math.round(precio * ({ estandar: 1, express: 1.35, consolidado: 0.85 }[tipo_servicio] ?? 1));

    const plazo = tipo_servicio === 'express'
      ? '48 hs hábiles'
      : `${tarifa.plazo_dias_min}–${tarifa.plazo_dias_max} días hábiles`;

    res.json({
      precio_total: precio,
      plazo,
      peso_efectivo_kg: Math.round(peso_efectivo * 10) / 10,
      tipo_servicio,
      moneda: 'ARS',
      iva_incluido: false,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.options('/:slug/cotizar', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = router;