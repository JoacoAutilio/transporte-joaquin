const router = require('express').Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const db = require('../db');
const { enviarMailConfirmacion } = require('./mails');

// Cada empresa tiene su propio Access Token de MP
// Por ahora usamos el de la plataforma, después cada empresa configura el suyo
const getMP = (accessToken) => new MercadoPagoConfig({ accessToken });

// GET /api/pagos/detalle/:id
router.get('/detalle/:id', async (req, res) => {
  try {
    const { rows: [e] } = await db.query(
      'SELECT origen, destino, tipo_servicio, estado, numero_seguimiento FROM widget_envios WHERE id=$1',
      [req.params.id]
    );
    if (!e) return res.status(404).json({ error: 'No encontrado' });
    res.json(e);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/pagos/confirmar/:numero — confirmar pago por numero de seguimiento (desde página de éxito)
router.get('/confirmar/:numero', async (req, res) => {
  try {
    const { rows: [envio] } = await db.query(
      `SELECT id, estado FROM widget_envios WHERE numero_seguimiento = $1`,
      [req.params.numero.toUpperCase()]
    );
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

    // Solo actualizar si está pendiente
    if (envio.estado === 'pendiente_pago') {
      await db.query(
        `UPDATE widget_envios SET estado = 'confirmado' WHERE id = $1`,
        [envio.id]
      );
      // Insertar evento de tracking si no existe
      const { rows: eventos } = await db.query(
        `SELECT id FROM tracking_widget WHERE envio_id = $1 LIMIT 1`,
        [envio.id]
      );
      if (!eventos.length) {
        await db.query(
          `INSERT INTO tracking_widget (envio_id, estado, descripcion)
           VALUES ($1, 'confirmado', 'Pago aprobado. Envío confirmado y en preparación.')`,
          [envio.id]
        );
      }
      enviarMailConfirmacion(envio.id);
    }
    res.json({ ok: true, estado: 'confirmado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// POST /api/pagos/:slug/crear
router.post('/:slug/crear', async (req, res) => {
  const {
    origen, destino, peso_kg, volumen_m3 = 0,
    alto_cm, ancho_cm, largo_cm, bultos = 1,
    tipo_servicio = 'estandar', precio_total,
    remitente, destinatario, modalidad, pago,
  } = req.body;

  if (!precio_total || !origen || !destino) {
    return res.status(400).json({ error: 'Faltan datos del envío' });
  }

  try {
    const { rows: [empresa] } = await db.query(
      'SELECT id, nombre, mp_access_token FROM empresas WHERE slug = $1 AND activo = TRUE',
      [req.params.slug]
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });

    const accessToken = empresa.mp_access_token || process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return res.status(500).json({ error: 'Mercado Pago no configurado' });

    const mp = getMP(accessToken);
    const preference = new Preference(mp);

    const numero = `TJ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Guardar envío como pendiente_pago ANTES de ir a MP
    const { rows: [envio] } = await db.query(
      `INSERT INTO widget_envios
        (empresa_id, origen, destino, peso_kg, volumen_m3, alto_cm, ancho_cm, largo_cm, bultos, tipo_servicio, precio_total,
          numero_seguimiento, estado, remitente_json, destinatario_json, modalidad, forma_pago, valor_declarado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pendiente_pago',$13,$14,$15,$16,$17)
      RETURNING id`,
      [empresa.id, origen, destino, peso_kg, volumen_m3 || 0,
      alto_cm || null, ancho_cm || null, largo_cm || null, bultos || 1,
      tipo_servicio, Math.round(precio_total / 1.21),
      numero,
      JSON.stringify(remitente || {}),
      JSON.stringify(destinatario || {}),
      modalidad, pago, req.body.valor_declarado ?? null]
    );

    const baseUrl = process.env.FRONTEND_URL || 'https://transporte-joaquin.onrender.com';

    const result = await preference.create({
      body: {
        items: [{
          id: String(envio.id),
          title: `Envío ${origen} → ${destino}`,
          description: `${tipo_servicio} · ${peso_kg}kg`,
          quantity: 1,
          unit_price: precio_total,
          currency_id: 'ARS',
        }],
        external_reference: numero,
        back_urls: {
          success: `${baseUrl}/pago-exitoso.html?numero=${numero}&modalidad=${modalidad}&slug=${req.params.slug}`,
          failure: `${baseUrl}/pago-fallido.html`,
          pending: `${baseUrl}/pago-pendiente.html?numero=${numero}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/pagos/webhook`,
      }
    });

    res.json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      numero_seguimiento: numero,
    });
  } catch (e) {
    console.error('MP error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pagos/:slug/sucursal — registrar envío para pagar en sucursal (sin MP)
router.post('/:slug/sucursal', async (req, res) => {
  const {
    origen, destino, peso_kg, volumen_m3 = 0,
    alto_cm, ancho_cm, largo_cm, bultos = 1,
    tipo_servicio = 'estandar', precio_total,
    remitente, destinatario, modalidad,
  } = req.body;

  if (!precio_total || !origen || !destino) {
    return res.status(400).json({ error: 'Faltan datos del envío' });
  }

  try {
    const { rows: [empresa] } = await db.query(
      'SELECT id FROM empresas WHERE slug = $1 AND activo = TRUE',
      [req.params.slug]
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });

    const numero = `TJ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.query(
      `INSERT INTO widget_envios
        (empresa_id, origen, destino, peso_kg, volumen_m3, alto_cm, ancho_cm, largo_cm, bultos, tipo_servicio, precio_total,
          numero_seguimiento, estado, remitente_json, destinatario_json, modalidad, forma_pago, valor_declarado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pendiente_pago',$13,$14,$15,'sucursal',$16)`,
      [empresa.id, origen, destino, peso_kg, volumen_m3 || 0,
      alto_cm || null, ancho_cm || null, largo_cm || null, bultos || 1,
      tipo_servicio, Math.round(precio_total / 1.21),
      numero,
      JSON.stringify(remitente || {}),
      JSON.stringify(destinatario || {}),
      modalidad, req.body.valor_declarado ?? null]
    );

    res.json({ numero_seguimiento: numero });
  } catch (e) {
    console.error('Sucursal error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pagos/webhook
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const { type, data } = req.body;
    if (type !== 'payment') return;

    const paymentId = data?.id;
    if (!paymentId) return;

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const payment = await r.json();

    if (payment.status === 'approved') {
      const numero = payment.external_reference;

      const { rows: [envio] } = await db.query(
        `UPDATE widget_envios SET estado = CASE
           WHEN modalidad LIKE 'domicilio%' THEN 'pendiente_retiro'
           ELSE 'pendiente_entrega_deposito'
         END, mp_payment_id = $1
         WHERE numero_seguimiento = $2 AND estado = 'pendiente_pago'
         RETURNING id, modalidad`,
        [paymentId, numero]
      );

      if (envio) {
        const esRetiro = envio.modalidad && envio.modalidad.startsWith('domicilio');
        const estadoTracking = esRetiro ? 'pendiente_retiro' : 'pendiente_entrega_deposito';
        const descTracking = esRetiro
          ? 'Pago confirmado. Coordinamos el retiro de tu paquete a la brevedad.'
          : 'Pago confirmado. Llevá tu paquete al depósito del transporte.';
        await db.query(
          `INSERT INTO tracking_widget (envio_id, estado, descripcion)
          VALUES ($1, $2, $3)`,
          [envio.id, estadoTracking, descTracking]
        );
        enviarMailConfirmacion(envio.id);
      }
    }
  } catch (e) {
    console.error('Webhook error:', e);
  }
});

// POST /api/pagos/:slug/confirmar-manual
router.post('/:slug/confirmar-manual', async (req, res) => {
  const { envio_id } = req.body;
  if (!envio_id) return res.status(400).json({ error: 'envio_id requerido' });
  try {
    const { rows: [envio] } = await db.query(
      `UPDATE widget_envios SET estado = CASE
        WHEN modalidad LIKE 'domicilio%' THEN 'pendiente_retiro'
        ELSE 'pendiente_entrega_deposito'
      END WHERE id = $1 RETURNING numero_seguimiento, modalidad`,
      [envio_id]
    );          
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
    const esRetiroManual = envio.modalidad && envio.modalidad.startsWith('domicilio');
    const estadoManual = esRetiroManual ? 'pendiente_retiro' : 'pendiente_entrega_deposito';
    const descManual = esRetiroManual
      ? 'Pago confirmado. Coordinamos el retiro de tu paquete a la brevedad.'
      : 'Pago confirmado. Llevá tu paquete al depósito del transporte.';
    await db.query(
      `INSERT INTO tracking_widget (envio_id, estado, descripcion)
      VALUES ($1, $2, $3)`,
      [envio_id, estadoManual, descManual]
    );
    enviarMailConfirmacion(envio_id);
    res.json({ ok: true, numero_seguimiento: envio.numero_seguimiento });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
