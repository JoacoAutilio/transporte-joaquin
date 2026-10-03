const { Resend } = require('resend');
const db = require('../db');

const FROM = process.env.MAIL_FROM || 'onboarding@resend.dev';
const NARANJA = '#E8500A';
const AZUL = '#0B1E3D';

const SERVICIOS = { estandar: 'Estándar', express: 'Express 48h', consolidado: 'Consolidado' };
const MODALIDADES = {
  deposito_sucursal: 'Depósito → Sucursal',
  deposito_domicilio: 'Depósito → Domicilio',
  domicilio_domicilio: 'Domicilio → Domicilio',
};
const PAGOS = { origen: 'Pago en origen', destino: 'Pago en destino', sucursal: 'Pago en sucursal' };

// Se crea recién al enviar, para que el server arranque aunque falte la API key
let resend;
const getResend = () => {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const parseJSON = (v) => {
  if (!v) return {};
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return {}; }
};

const fmt = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');

const nombrePersona = (p) => (p.tipo === 'empresa' ? p.nombre : [p.nombre, p.apellido].filter(Boolean).join(' '));

const direccion = (p) =>
  [p.calle, p.numero].filter(Boolean).join(' ')
  + (p.entre ? `, entre ${p.entre}` : '')
  + (p.cp ? ` (CP ${p.cp})` : '');

// ── Bloques HTML
const fila = (label, valor) => `
  <tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #eef0f3">${esc(label)}</td>
    <td style="padding:8px 0;color:${AZUL};font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #eef0f3">${esc(valor || '—')}</td>
  </tr>`;

const seccion = (titulo, filas) => `
  <h3 style="margin:24px 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:${NARANJA}">${esc(titulo)}</h3>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${filas.join('')}</table>`;

const codigoBox = (numero) => `
  <div style="background:${AZUL};border-radius:10px;padding:18px;text-align:center;margin:8px 0 4px">
    <div style="color:rgba(255,255,255,.7);font-size:12px;letter-spacing:.08em;text-transform:uppercase">Código de seguimiento</div>
    <div style="color:#fff;font-size:26px;font-weight:800;letter-spacing:.06em;margin-top:6px;font-family:'Courier New',monospace">${esc(numero)}</div>
  </div>`;

const aviso = `
  <div style="background:#fff4ed;border-left:4px solid ${NARANJA};border-radius:6px;padding:12px 14px;margin-top:20px;color:#9a3412;font-size:13px">
    ⚠️ Precio sujeto a modificación según pesaje real en sucursal.
  </div>`;

const layout = (empresaNombre, titulo, contenido) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
        <tr><td style="background:${AZUL};padding:22px 28px;border-bottom:4px solid ${NARANJA}">
          <div style="color:#fff;font-size:20px;font-weight:800">${esc(empresaNombre)}</div>
          <div style="color:rgba(255,255,255,.75);font-size:14px;margin-top:4px">${esc(titulo)}</div>
        </td></tr>
        <tr><td style="padding:24px 28px">${contenido}</td></tr>
        <tr><td style="background:#f9fafb;padding:16px 28px;color:#9ca3af;font-size:12px;text-align:center">
          Este es un mensaje automático de ${esc(empresaNombre)}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

// ── Mails
const htmlCliente = (e, emp, rem, dest, total) => layout(emp.nombre, 'Tu envío fue confirmado', `
  <p style="margin:0 0 16px;color:${AZUL};font-size:15px">Hola <strong>${esc(nombrePersona(rem) || '')}</strong>, tu envío fue registrado correctamente. Guardá este código para seguirlo:</p>
  ${codigoBox(e.numero_seguimiento)}
  ${seccion('Resumen del envío', [
    fila('Origen', e.origen),
    fila('Destino', e.destino),
    fila('Destinatario', nombrePersona(dest)),
    fila('Servicio', SERVICIOS[e.tipo_servicio] || e.tipo_servicio),
    fila('Modalidad', MODALIDADES[e.modalidad] || e.modalidad),
    fila('Forma de pago', PAGOS[e.forma_pago] || e.forma_pago),
  ])}
  <div style="margin-top:20px;padding:16px;border:2px solid ${NARANJA};border-radius:10px;text-align:center">
    <div style="color:#6b7280;font-size:13px">Total (IVA incluido)</div>
    <div style="color:${NARANJA};font-size:28px;font-weight:800;margin-top:4px">${fmt(total)}</div>
  </div>
  ${aviso}
  ${seccion('Contacto', [
    fila('Empresa', emp.nombre),
    fila('Teléfono', emp.telefono),
    fila('Email', emp.email),
  ])}`);

const htmlEmpleado = (e, emp, rem, dest, total) => layout(emp.nombre, 'Nuevo envío confirmado', `
  ${codigoBox(e.numero_seguimiento)}
  ${seccion('Envío', [
    fila('Ruta', `${e.origen} → ${e.destino}`),
    fila('Peso', e.peso_kg != null ? `${Number(e.peso_kg)} kg` : ''),
    fila('Servicio', SERVICIOS[e.tipo_servicio] || e.tipo_servicio),
    fila('Modalidad', MODALIDADES[e.modalidad] || e.modalidad),
    fila('Forma de pago', PAGOS[e.forma_pago] || e.forma_pago),
    fila('Precio sin IVA', fmt(e.precio_total)),
    fila('Total con IVA', fmt(total)),
  ])}
  ${seccion('Remitente', [
    fila('Tipo', rem.tipo === 'empresa' ? 'Empresa' : 'Particular'),
    fila('Nombre', nombrePersona(rem)),
    fila(rem.tipo === 'empresa' ? 'CUIT' : 'DNI', rem.doc),
    fila('Celular', rem.celular),
    fila('Email', rem.email),
    fila('Dirección', direccion(rem)),
  ])}
  ${seccion('Destinatario', [
    fila('Tipo', dest.tipo === 'empresa' ? 'Empresa' : 'Particular'),
    fila('Nombre', nombrePersona(dest)),
    fila(dest.tipo === 'empresa' ? 'CUIT' : 'DNI', dest.doc),
    fila('Celular', dest.celular),
    fila('Email', dest.email),
    fila('Dirección', direccion(dest)),
  ])}`);

const ESTADOS = {
  pendiente_pago: 'Pendiente de pago',
  pendiente_retiro: 'Pendiente de retiro',
  pendiente_entrega_deposito: 'Pendiente de entrega en depósito',
  confirmado: 'Confirmado',
};

const htmlNuevoEnvio = (e, emp, rem, dest, total, p) => layout(emp.nombre, 'Nuevo envío registrado', `
  ${codigoBox(e.numero_seguimiento)}
  ${seccion('Envío', [
    fila('Estado', ESTADOS[e.estado] || e.estado),
    fila('Origen', e.origen),
    fila('Destino', e.destino),
    fila('Remitente', nombrePersona(rem)),
    fila('Destinatario', nombrePersona(dest)),
    fila('Peso', e.peso_kg != null ? `${Number(e.peso_kg)} kg` : ''),
    fila('Valor declarado', e.valor_declarado != null ? fmt(e.valor_declarado) : ''),
    fila('Modalidad', MODALIDADES[e.modalidad] || e.modalidad),
    fila('Forma de pago', PAGOS[e.forma_pago] || e.forma_pago),
  ])}
  ${e.precio_total != null ? seccion('Precio', [
    fila('Flete (sin IVA)', fmt(p.flete)),
    p.seguro > 0 ? fila(`Seguro (${p.seguroPct}%)`, fmt(p.seguro)) : '',
    fila('IVA (21%)', fmt(p.iva)),
  ]) : ''}
  <div style="margin-top:20px;padding:16px;border:2px solid ${NARANJA};border-radius:10px;text-align:center">
    <div style="color:#6b7280;font-size:13px">Total (IVA incluido)</div>
    <div style="color:${NARANJA};font-size:28px;font-weight:800;margin-top:4px">${e.precio_total != null ? fmt(total) : '—'}</div>
  </div>`);

// Aviso a la empresa cuando se crea un envío (widget o carga manual).
// precioConIva: los envíos manuales guardan precio_total con IVA; los del widget, sin IVA.
// Nunca lanza: un error de mail no debe romper la creación del envío
async function enviarMailNuevoEnvio(envioId, { precioConIva = false } = {}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY no configurada, no se envían mails');
      return;
    }

    const { rows: [e] } = await db.query(
      `SELECT empresa_id, remitente_json, destinatario_json, origen, destino, peso_kg, valor_declarado,
              precio_total, numero_seguimiento, forma_pago, modalidad, estado
       FROM widget_envios WHERE id = $1`,
      [envioId]
    );
    if (!e) return console.warn(`Mail: envío ${envioId} no encontrado`);

    const { rows: [emp] } = await db.query(
      'SELECT nombre, email_admin AS email, seguro_porcentaje FROM empresas WHERE id = $1',
      [e.empresa_id]
    );
    if (!emp?.email) return; // la empresa no tiene email cargado

    const rem = parseJSON(e.remitente_json);
    const dest = parseJSON(e.destinatario_json);
    const total = precioConIva ? Number(e.precio_total) : Math.round(Number(e.precio_total) * 1.21);

    // Desglose: el seguro no se guarda aparte, se recalcula con el % actual de la empresa.
    // Solo aplica a envíos del widget; la carga manual no suma seguro.
    const seguroPct = Number(emp.seguro_porcentaje) || 0;
    const seguro = !precioConIva && seguroPct > 0 && Number(e.valor_declarado) > 0
      ? Math.round(Number(e.valor_declarado) * seguroPct / 100)
      : 0;
    const sinIVA = precioConIva ? Math.round(total / 1.21) : Math.round(Number(e.precio_total));
    const desglose = { flete: sinIVA - seguro, seguro, seguroPct, iva: total - sinIVA };

    const { error } = await getResend().emails.send({
      from: FROM,
      to: emp.email,
      subject: `Nuevo envío ${e.numero_seguimiento}: ${e.origen} → ${e.destino}`,
      html: htmlNuevoEnvio(e, emp, rem, dest, total, desglose),
    });
    if (error) console.error('Resend error:', error);
  } catch (err) {
    console.error('Error enviando mail de nuevo envío:', err);
  }
}

// Nunca lanza: un error de mail no debe romper la confirmación del pago
async function enviarMailConfirmacion(envioId) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY no configurada, no se envían mails');
      return;
    }

    const { rows: [e] } = await db.query(
      `SELECT empresa_id, remitente_json, destinatario_json, origen, destino, peso_kg,
              tipo_servicio, precio_total, numero_seguimiento, forma_pago, modalidad
       FROM widget_envios WHERE id = $1`,
      [envioId]
    );
    if (!e) return console.warn(`Mail: envío ${envioId} no encontrado`);

    const { rows: [emp] } = await db.query(
      'SELECT nombre, email_admin AS email, telefono FROM empresas WHERE id = $1',
      [e.empresa_id]
    );
    if (!emp) return console.warn(`Mail: empresa del envío ${envioId} no encontrada`);

    const rem = parseJSON(e.remitente_json);
    const dest = parseJSON(e.destinatario_json);
    // precio_total se guarda sin IVA
    const total = Math.round(Number(e.precio_total) * 1.21);

    const envios = [];
    if (rem.email) {
      envios.push(getResend().emails.send({
        from: FROM,
        to: rem.email,
        subject: `Tu envío ${e.numero_seguimiento} fue confirmado`,
        html: htmlCliente(e, emp, rem, dest, total),
      }));
    }
    if (emp.email) {
      envios.push(getResend().emails.send({
        from: FROM,
        to: emp.email,
        subject: `Nuevo envío ${e.numero_seguimiento}: ${e.origen} → ${e.destino}`,
        html: htmlEmpleado(e, emp, rem, dest, total),
      }));
    }

    const resultados = await Promise.allSettled(envios);
    resultados.forEach((r) => {
      if (r.status === 'rejected') console.error('Resend error:', r.reason);
      else if (r.value?.error) console.error('Resend error:', r.value.error);
    });
  } catch (err) {
    console.error('Error enviando mails de confirmación:', err);
  }
}

module.exports = { enviarMailConfirmacion, enviarMailNuevoEnvio };
