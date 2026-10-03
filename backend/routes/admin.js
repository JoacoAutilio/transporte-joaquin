const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { enviarMailNuevoEnvio } = require('./mails');

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

// ── ENVÍOS ─────────────────────────────────────────────────────

// GET /api/admin/envios
router.get('/envios', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, numero_seguimiento, origen, destino, tipo_servicio,
         estado, precio_total, created_at
       FROM widget_envios WHERE empresa_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [req.empresa.id]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/envios/:id/estado
router.patch('/envios/:id/estado', async (req, res) => {
  const { estado, descripcion, ubicacion } = req.body;
  const estadosValidos = ['confirmado','en_transito','en_centro','en_camino','entregado','cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    // Verificar que el envío pertenece a esta empresa
    const { rows: [envio] } = await db.query(
      'SELECT id FROM widget_envios WHERE id=$1 AND empresa_id=$2',
      [req.params.id, req.empresa.id]
    );
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

    await db.query(
      'UPDATE widget_envios SET estado=$1 WHERE id=$2',
      [estado, req.params.id]
    );
    await db.query(
      `INSERT INTO tracking_widget (envio_id, estado, descripcion, ubicacion)
       VALUES ($1,$2,$3,$4)`,
      [req.params.id, estado, descripcion || null, ubicacion || null]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── CONFIGURACIÓN ─────────────────────────────────────────────

router.put('/configuracion', async (req, res) => {
  const {
    nombre, telefono, color_primario, mp_access_token,
    email_admin,
    direccion, cuit, direccion_deposito, codigo_prefijo,
    recargo_destino_tipo, recargo_destino_valor,
    limite_peso_kg, limite_largo_cm, limite_ancho_cm, limite_alto_cm, limite_volumen_m3
  } = req.body;
  try {
    await db.query(
      `UPDATE empresas SET
         nombre = COALESCE($1, nombre),
         telefono = COALESCE($2, telefono),
         color_primario = COALESCE($3, color_primario),
         mp_access_token = COALESCE($4, mp_access_token),
         email_admin = COALESCE($5, email_admin),
         direccion = COALESCE($6, direccion),
         cuit = COALESCE($7, cuit),
         direccion_deposito = COALESCE($8, direccion_deposito),
         codigo_prefijo = COALESCE($9, codigo_prefijo),
         recargo_destino_tipo = COALESCE($10, recargo_destino_tipo),
         recargo_destino_valor = COALESCE($11, recargo_destino_valor),
         limite_peso_kg = $12,
         limite_largo_cm = $13,
         limite_ancho_cm = $14,
         limite_alto_cm = $15,
         limite_volumen_m3 = $16
       WHERE id = $17`,
      [
        nombre || null, telefono || null, color_primario || null, mp_access_token || null,
        email_admin || null,
        direccion || null, cuit || null, direccion_deposito || null, codigo_prefijo || null,
        recargo_destino_tipo || null, recargo_destino_valor || null,
        limite_peso_kg || null, limite_largo_cm || null, limite_ancho_cm || null,
        limite_alto_cm || null, limite_volumen_m3 || null,
        req.empresa.id
      ]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ── CANCELAR ENVÍO ────────────────────────────────────────────

router.patch('/envios/:id/cancelar', async (req, res) => {
  const { motivo } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT estado FROM widget_envios WHERE id = $1 AND empresa_id = $2`,
      [req.params.id, req.empresa.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    if (rows[0].estado === 'cancelado') return res.status(400).json({ error: 'Ya está cancelado' });

    await db.query(
      `UPDATE widget_envios SET estado = 'cancelado' WHERE id = $1 AND empresa_id = $2`,
      [req.params.id, req.empresa.id]
    );
    await db.query(
      `INSERT INTO tracking_widget (envio_id, estado, descripcion)
       VALUES ($1, 'cancelado', $2)`,
      [req.params.id, motivo || 'Envío cancelado por la empresa']
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ELIMINAR ENVÍO (solo si está cancelado) ───────────────────

router.delete('/envios/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT estado FROM widget_envios WHERE id = $1 AND empresa_id = $2`,
      [req.params.id, req.empresa.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    if (rows[0].estado !== 'cancelado') return res.status(400).json({ error: 'Solo se pueden eliminar envíos cancelados' });

    await db.query(`DELETE FROM tracking_widget WHERE envio_id = $1`, [req.params.id]);
    await db.query(`DELETE FROM widget_envios WHERE id = $1 AND empresa_id = $2`, [req.params.id, req.empresa.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
// ── CARGA MANUAL DE ENVÍO ─────────────────────────────────────
router.post('/envios/manual', async (req, res) => {
  const { origen, destino, modalidad, tipo_servicio, forma_pago, peso_kg, bultos, precio_total, valor_declarado, remitente, destinatario } = req.body;
  if (!origen || !destino || !peso_kg || !remitente || !destinatario) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!(parseFloat(valor_declarado) > 0)) {
    return res.status(400).json({ error: 'Ingresá el valor declarado de la mercadería' });
  }
  try {
    // Generar número de seguimiento
    const { rows: [emp] } = await db.query('SELECT codigo_prefijo FROM empresas WHERE id=$1', [req.empresa.id]);
    const prefijo = emp.codigo_prefijo || 'ENV';
    const año = new Date().getFullYear();
    const { rows: [cnt] } = await db.query('SELECT COUNT(*) FROM widget_envios WHERE empresa_id=$1', [req.empresa.id]);
    const numero = `${prefijo}-${año}-${String(parseInt(cnt.count)+1).padStart(6,'0')}`;

    // Calcular precio si no se ingresó
    let precio = precio_total;
    if (!precio) {
      const { rows: [tarifa] } = await db.query(
        `SELECT precio_base, precio_por_kg FROM empresas_tarifas WHERE empresa_id=$1 AND origen=$2 AND destino=$3 AND activo=TRUE LIMIT 1`,
        [req.empresa.id, origen, destino]
      );
      if (tarifa) {
        precio = parseFloat(tarifa.precio_base) + Math.max(0, parseFloat(peso_kg) - 50) * parseFloat(tarifa.precio_por_kg);
        precio = Math.round(precio * 1.21); // con IVA
      }
    }

    const remJson = JSON.stringify(remitente);
    const destJson = JSON.stringify(destinatario);

    // Estado inicial según modalidad: solo domicilio→domicilio requiere retiro
    const modalidadFinal = modalidad || 'deposito_sucursal';
    const estado = modalidadFinal === 'domicilio_domicilio' ? 'pendiente_retiro' : 'pendiente_entrega_deposito';
    const descripcionTracking = estado === 'pendiente_retiro'
      ? 'Envío registrado. Coordinaremos el retiro a domicilio.'
      : 'Envío registrado. El cliente debe entregar el paquete en el depósito.';

    const { rows: [envio] } = await db.query(
      `INSERT INTO widget_envios
        (empresa_id, numero_seguimiento, origen, destino, modalidad, tipo_servicio, forma_pago,
        peso_kg, bultos, largo_cm, ancho_cm, alto_cm, precio_total, estado, remitente_json, destinatario_json,
        valor_declarado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id, numero_seguimiento`,
      [req.empresa.id, numero, origen, destino, modalidadFinal,
      tipo_servicio || 'estandar', forma_pago || 'origen',
      peso_kg, bultos || 1, req.body.largo_cm || null, req.body.ancho_cm || null, req.body.alto_cm || null,
      precio || null,
      estado,
      remJson, destJson, parseFloat(valor_declarado)]
    );

    await db.query(
      `INSERT INTO tracking_widget (envio_id, estado, descripcion) VALUES ($1,$2,$3)`,
      [envio.id, estado, descripcionTracking]
    );

    // Los envíos manuales guardan precio_total con IVA
    enviarMailNuevoEnvio(envio.id, { precioConIva: true });
    res.status(201).json({ ok: true, numero_seguimiento: envio.numero_seguimiento });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
// ── REMITO ────────────────────────────────────────────────────

router.patch('/envios/:id/remito', async (req, res) => {
  const { peso_real_kg, bultos, alto_cm, ancho_cm, largo_cm, observaciones_recepcion, confirmado_por } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT estado FROM widget_envios WHERE id = $1 AND empresa_id = $2`,
      [req.params.id, req.empresa.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    if (rows[0].estado === 'pendiente_pago') return res.status(400).json({ error: 'El envío no está confirmado' });

    await db.query(
      `UPDATE widget_envios SET
         peso_real_kg = COALESCE($1, peso_real_kg),
         bultos = COALESCE($2, bultos),
         alto_cm = COALESCE($3, alto_cm),
         ancho_cm = COALESCE($4, ancho_cm),
         largo_cm = COALESCE($5, largo_cm),
         observaciones_recepcion = COALESCE($6, observaciones_recepcion),
         remito_confirmado_at = NOW(),
         remito_confirmado_por = COALESCE($7, remito_confirmado_por),
         estado = 'en_deposito_origen'
       WHERE id = $8 AND empresa_id = $9`,
      [peso_real_kg || null, bultos || null, alto_cm || null, ancho_cm || null,
       largo_cm || null, observaciones_recepcion || null, confirmado_por || null,
       req.params.id, req.empresa.id]
    );
    await db.query(
      `INSERT INTO tracking_widget (envio_id, estado, descripcion)
       VALUES ($1, 'en_deposito_origen', 'Paquete recibido en depósito de origen')`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/envios/:id/remito/datos', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, emp.nombre AS empresa_nombre, emp.telefono AS empresa_telefono,
              emp.cuit AS empresa_cuit, emp.direccion AS empresa_direccion,
              emp.color_primario, emp.slug
       FROM widget_envios e
       JOIN empresas emp ON e.empresa_id = emp.id
       WHERE e.id = $1 AND e.empresa_id = $2`,
      [req.params.id, req.empresa.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    const e = rows[0];
    e.remitente = JSON.parse(e.remitente_json || '{}');
    e.destinatario = JSON.parse(e.destinatario_json || '{}');
    res.json(e);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
