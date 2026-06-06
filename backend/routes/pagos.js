const router = require('express').Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const db = require('../db');

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

// POST /api/pagos/:slug/crear
// Crea una preferencia de pago en MP y devuelve el link
router.post('/:slug/crear', async (req, res) => {
  const {
    origen, destino, peso_kg, volumen_m3 = 0,
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

    // Usar el access token de la empresa o el de la plataforma
    const accessToken = empresa.mp_access_token || process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return res.status(500).json({ error: 'Mercado Pago no configurado' });

    const mp = getMP(accessToken);
    const preference = new Preference(mp);

    // Guardar el pedido pendiente de pago
    const numero = `TJ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const { rows: [envio] } = await db.query(
      `INSERT INTO widget_envios
         (empresa_id, origen, destino, peso_kg, tipo_servicio, precio_total,
          numero_seguimiento, estado, remitente_json, destinatario_json, modalidad, forma_pago)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente_pago',$8,$9,$10,$11)
       RETURNING id`,
      [empresa.id, origen, destino, peso_kg, tipo_servicio,
       Math.round(precio_total / 1.21), // precio sin IVA para guardar
       numero,
       JSON.stringify(remitente || {}),
       JSON.stringify(destinatario || {}),
       modalidad, pago]
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
        external_reference: String(envio.id),
        back_urls: {
          success: `${baseUrl}/pago-exitoso.html?envio=${envio.id}&numero=${numero}`,
          failure: `${baseUrl}/pago-fallido.html?envio=${envio.id}`,
          pending: `${baseUrl}/pago-pendiente.html?envio=${envio.id}&numero=${numero}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/pagos/webhook`,
        metadata: { envio_id: envio.id, numero_seguimiento: numero, slug: req.params.slug },
      }
    });

    res.json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      numero_seguimiento: numero,
      envio_id: envio.id,
    });
  } catch (e) {
    console.error('MP error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pagos/webhook — notificación de MP
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Responder rápido a MP
  try {
    const { type, data } = req.body;
    if (type !== 'payment') return;

    const paymentId = data?.id;
    if (!paymentId) return;

    // Consultar el pago a MP
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const payment = await r.json();

    if (payment.status === 'approved') {
      const envioId = payment.external_reference;
      await db.query(
        `UPDATE widget_envios SET estado = 'confirmado', mp_payment_id = $1 WHERE id = $2`,
        [paymentId, envioId]
      );
      // Agregar evento de tracking
      await db.query(
        `INSERT INTO tracking_widget (envio_id, estado, descripcion)
         VALUES ($1, 'confirmado', 'Pago aprobado. Envío confirmado.')`,
        [envioId]
      );
    }
  } catch (e) {
    console.error('Webhook error:', e);
  }
});

// POST /api/pagos/:slug/confirmar-manual — confirmación manual desde el panel admin
router.post('/:slug/confirmar-manual', async (req, res) => {
  const { envio_id } = req.body;
  if (!envio_id) return res.status(400).json({ error: 'envio_id requerido' });
  try {
    const { rows: [envio] } = await db.query(
      `UPDATE widget_envios SET estado = 'confirmado' WHERE id = $1 RETURNING numero_seguimiento`,
      [envio_id]
    );
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
    await db.query(
      `INSERT INTO tracking_widget (envio_id, estado, descripcion)
       VALUES ($1, 'confirmado', 'Pago confirmado manualmente por la empresa.')`,
      [envio_id]
    );
    res.json({ ok: true, numero_seguimiento: envio.numero_seguimiento });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
