(function () {
  const scriptTag   = document.currentScript;
  const empresa     = scriptTag.getAttribute('data-empresa') || 'demo';
  const API_BASE    = scriptTag.getAttribute('data-api') || window.location.origin;
  const containerId = scriptTag.getAttribute('data-container') || 'cotizador-widget';

  const PROVINCIAS = {
    "Buenos Aires": ["AMBA / Gran Buenos Aires","La Plata","Mar del Plata","Bahía Blanca","Tandil","Quilmes","Lomas de Zamora","Lanús","General San Martín","Morón","Tigre","San Isidro","Vicente López","Tres de Febrero","Merlo","Moreno","La Matanza","Almirante Brown","Florencio Varela","Berazategui","Avellaneda","Zárate","Campana","Junín","Pergamino","Necochea","Olavarría","Azul"],
    "CABA": ["Ciudad Autónoma de Buenos Aires"],
    "Córdoba": ["Córdoba Capital","Río Cuarto","Villa María","San Francisco","Alta Gracia","Bell Ville","Villa Carlos Paz","Cosquín","Jesús María","Marcos Juárez","La Falda","Cruz del Eje"],
    "Santa Fe": ["Rosario","Santa Fe Capital","Rafaela","Venado Tuerto","Santo Tomé","Reconquista","Esperanza","Casilda","Cañada de Gómez"],
    "Mendoza": ["Mendoza Capital","San Rafael","Godoy Cruz","Luján de Cuyo","Maipú","Rivadavia","Tunuyán","Malargüe","Las Heras"],
    "Tucumán": ["San Miguel de Tucumán","Concepción","Banda del Río Salí","Yerba Buena","Aguilares","Monteros","Tafí Viejo"],
    "Salta": ["Salta Capital","San Ramón de la Nueva Orán","Tartagal","Metán","Rosario de la Frontera","Cafayate","General Güemes"],
    "Misiones": ["Posadas","Oberá","Eldorado","Puerto Iguazú","Apóstoles","Leandro N. Alem"],
    "Entre Ríos": ["Paraná","Concordia","Gualeguaychú","Concepción del Uruguay","Gualeguay","Villaguay","Chajarí"],
    "Chaco": ["Resistencia","Presidencia Roque Sáenz Peña","Villa Ángela","Charata","Barranqueras"],
    "Corrientes": ["Corrientes Capital","Goya","Paso de los Libres","Curuzú Cuatiá","Mercedes","Santo Tomé"],
    "Jujuy": ["San Salvador de Jujuy","Palpalá","San Pedro de Jujuy","Libertador General San Martín","Humahuaca"],
    "Río Negro": ["Viedma","Bariloche","Cipolletti","General Roca","Allen","El Bolsón"],
    "Neuquén": ["Neuquén Capital","Cutral-Có","Plaza Huincul","Zapala","San Martín de los Andes","Villa La Angostura"],
    "San Juan": ["San Juan Capital","Rawson","Chimbas","Rivadavia","Santa Lucía","Caucete"],
    "San Luis": ["San Luis Capital","Villa Mercedes","Merlo","Concarán","Justo Daract"],
    "La Pampa": ["Santa Rosa","General Pico","Toay","Eduardo Castex","General Acha"],
    "Formosa": ["Formosa Capital","Clorinda","Pirané"],
    "Catamarca": ["San Fernando del Valle de Catamarca","Tinogasta","Andalgalá","Belén","Santa María"],
    "La Rioja": ["La Rioja Capital","Chilecito","Aimogasta","Chepes","Chamical"],
    "Santiago del Estero": ["Santiago del Estero Capital","La Banda","Termas de Río Hondo","Añatuya","Frías"],
    "Chubut": ["Rawson","Comodoro Rivadavia","Puerto Madryn","Trelew","Esquel","Rada Tilly"],
    "Santa Cruz": ["Río Gallegos","Caleta Olivia","Pico Truncado","Puerto Deseado","El Calafate"],
    "Tierra del Fuego": ["Ushuaia","Río Grande","Tolhuin"],
  };

  const MODALIDADES = [
    { value: "deposito_sucursal",   label: "Entrega en depósito → Retiro en sucursal" },
    { value: "deposito_domicilio",  label: "Entrega en depósito → Entrega a domicilio" },
    { value: "domicilio_domicilio", label: "Retiro a domicilio → Entrega a domicilio" },
  ];

  function injectStyles(c1, c2) {
    if (document.getElementById('cw-styles')) return;
    const s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = `
      #cw-root *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
      #cw-root{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;max-width:620px;width:100%}
      #cw-root h2{font-size:19px;font-weight:800;color:${c2};margin:0 0 6px}
      .cw-tabs{display:flex;gap:0;margin-bottom:20px;border:1.5px solid #e5e7eb;border-radius:8px;overflow:hidden}
      .cw-tab{flex:1;padding:9px;font-size:13px;font-weight:600;background:#f9fafb;border:none;cursor:pointer;color:#6b7280;font-family:inherit;transition:all .15s}
      .cw-tab.on{background:${c1};color:#fff}
      .cw-panel{display:none}.cw-panel.on{display:block}
      .cw-row{margin-bottom:14px}
      .cw-row label{display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
      .cw-row select,.cw-row input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#111;outline:none;transition:border-color .2s;background:#fff}
      .cw-row select:focus,.cw-row input:focus{border-color:${c1}}
      .cw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
      .cw-section{background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:14px}
      .cw-stitle{font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
      .cw-vol-info{font-size:12px;color:#6b7280;margin-top:6px;background:#f3f4f6;padding:6px 10px;border-radius:6px;display:none}
      .cw-vol-info span{font-weight:700;color:${c1}}
      #cw-btn{width:100%;background:${c1};color:#fff;border:none;padding:13px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;transition:opacity .2s}
      #cw-btn:hover{opacity:.88}#cw-btn:disabled{opacity:.55;cursor:not-allowed}
      #cw-result{margin-top:20px;background:${c2};border-radius:10px;padding:22px;color:#fff;display:none}
      .cw-price{font-size:44px;font-weight:800;line-height:1}
      .cw-unit{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:14px}
      .cw-badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;margin-bottom:16px}
      .cw-rows{border-top:1px solid rgba(255,255,255,.15);padding-top:14px;margin-top:8px}
      .cw-dr{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.65);padding:4px 0}
      .cw-dr.total{color:#fff;font-weight:700;font-size:15px;border-top:1px solid rgba(255,255,255,.2);margin-top:6px;padding-top:10px}
      .cw-seguimiento{margin-top:16px;background:rgba(255,255,255,.1);border-radius:8px;padding:14px;text-align:center}
      .cw-seguimiento p{font-size:12px;color:rgba(255,255,255,.6);margin-bottom:6px}
      .cw-codigo{font-size:22px;font-weight:800;letter-spacing:2px;color:#fff}
      .cw-copy{background:rgba(255,255,255,.15);border:none;color:#fff;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;margin-top:6px;font-family:inherit}
      #cw-error{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:10px;display:none}
      #cw-loading{text-align:center;color:#6b7280;font-size:13px;padding:10px;display:none}
      /* TRACKING */
      .cw-track-wrap{display:flex;gap:8px;margin-bottom:16px}
      .cw-track-wrap input{flex:1;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;text-transform:uppercase}
      .cw-track-wrap input:focus{border-color:${c1}}
      .cw-track-btn{background:${c1};color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
      #cw-track-result{display:none}
      .cw-track-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px}
      .cw-track-estado{display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:14px}
      .cw-track-info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
      .cw-track-info div p:first-child{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;font-weight:600}
      .cw-track-info div p:last-child{font-size:14px;font-weight:600;color:#111;margin-top:2px}
      .cw-timeline{border-left:2px solid #e5e7eb;padding-left:16px;margin-top:4px}
      .cw-ev{position:relative;margin-bottom:14px}
      .cw-ev::before{content:'';position:absolute;left:-21px;top:4px;width:10px;height:10px;border-radius:50%;background:${c1};border:2px solid #fff;box-shadow:0 0 0 2px ${c1}}
      .cw-ev p{font-size:13px;font-weight:600;color:#111}
      .cw-ev small{font-size:12px;color:#6b7280}
      #cw-track-error{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;display:none;margin-top:10px}
    `;
    document.head.appendChild(s);
  }

  const estadoColors = {
    confirmado:  '#3b82f6', en_transito: '#f59e0b',
    en_destino:  '#8b5cf6', entregado:   '#16a34a',
    cancelado:   '#dc2626', presupuesto: '#6b7280',
  };
  const estadoLabels = {
    confirmado:'Confirmado', en_transito:'En tránsito',
    en_destino:'En destino', entregado:'Entregado',
    cancelado:'Cancelado',   presupuesto:'Presupuesto',
  };

  function generarCodigo() {
    const año  = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `TJ-${año}-${rand}`;
  }

  function buildHTML(config) {
    const { empresa: emp } = config;
    injectStyles(emp.color_primario, emp.color_secundario || '#0B1E3D');

    const provOptions = Object.keys(PROVINCIAS).map(p =>
      `<option value="${p}">${p}</option>`
    ).join('');

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div id="cw-root">
        <h2>📦 ${emp.nombre || 'Cotizador de envíos'}</h2>

        <div class="cw-tabs">
          <button class="cw-tab on" onclick="cwTab('cotizar',this)">Cotizar envío</button>
          <button class="cw-tab" onclick="cwTab('tracking',this)">Rastrear envío</button>
        </div>

        <!-- ═══ PANEL COTIZAR ═══ -->
        <div class="cw-panel on" id="cw-panel-cotizar">

          <div class="cw-section">
            <div class="cw-stitle">📍 Origen</div>
            <div class="cw-g2">
              <div class="cw-row"><label>Provincia</label>
                <select id="cw-prov-origen" onchange="cwCiudades('origen')">
                  <option value="">— Seleccioná —</option>${provOptions}
                </select>
              </div>
              <div class="cw-row"><label>Ciudad</label>
                <select id="cw-ciudad-origen" disabled><option value="">— Primero provincia —</option></select>
              </div>
            </div>
          </div>

          <div class="cw-section">
            <div class="cw-stitle">🏁 Destino</div>
            <div class="cw-g2">
              <div class="cw-row"><label>Provincia</label>
                <select id="cw-prov-destino" onchange="cwCiudades('destino')">
                  <option value="">— Seleccioná —</option>${provOptions}
                </select>
              </div>
              <div class="cw-row"><label>Ciudad</label>
                <select id="cw-ciudad-destino" disabled><option value="">— Primero provincia —</option></select>
              </div>
            </div>
          </div>

          <div class="cw-g2">
            <div class="cw-row">
              <label>Modalidad de envío</label>
              <select id="cw-modalidad">
                ${MODALIDADES.map(m=>`<option value="${m.value}">${m.label}</option>`).join('')}
              </select>
            </div>
            <div class="cw-row">
              <label>Forma de pago</label>
              <select id="cw-pago">
                <option value="origen">Pago en origen (quien envía)</option>
                <option value="destino">Pago en destino (quien recibe)</option>
              </select>
            </div>
          </div>

          <div class="cw-section">
            <div class="cw-stitle">⚖️ Peso y dimensiones</div>
            <div class="cw-g2">
              <div class="cw-row"><label>Peso (kg) *</label>
                <input type="number" id="cw-peso" placeholder="0" min="0.1" step="0.1" oninput="cwVol()">
              </div>
              <div class="cw-row"><label>Cantidad de bultos</label>
                <input type="number" id="cw-bultos" placeholder="1" min="1" value="1" oninput="cwVol()">
              </div>
            </div>
            <div class="cw-stitle" style="margin-top:4px">📐 Dimensiones por bulto en cm (opcional)</div>
            <div class="cw-g3">
              <div class="cw-row"><label>Largo</label><input type="number" id="cw-largo" placeholder="0" min="0" oninput="cwVol()"></div>
              <div class="cw-row"><label>Ancho</label><input type="number" id="cw-ancho" placeholder="0" min="0" oninput="cwVol()"></div>
              <div class="cw-row"><label>Alto</label> <input type="number" id="cw-alto"  placeholder="0" min="0" oninput="cwVol()"></div>
            </div>
            <div class="cw-vol-info" id="cw-vol-info">
              Volumen: <span id="cw-vol-val">—</span> m³ · Peso volumétrico: <span id="cw-pvol-val">—</span> kg
            </div>
          </div>

          <div class="cw-row">
            <label>Tipo de servicio</label>
            <select id="cw-servicio">
              <option value="estandar">Estándar (3–5 días hábiles)</option>
              <option value="express">Express 48 hs hábiles (+35%)</option>
              <option value="consolidado">Consolidado (–15%)</option>
            </select>
          </div>

          <button id="cw-btn">Calcular precio →</button>
          <div id="cw-loading">Calculando...</div>
          <div id="cw-error"></div>

          <div id="cw-result">
            <div class="cw-price" id="cw-precio"></div>
            <div class="cw-unit">ARS · IVA incluido (21%) · Precio referencial</div>
            <div class="cw-badge" id="cw-plazo"></div>
            <div class="cw-rows">
              <div class="cw-dr"><span>Precio sin IVA</span><span id="cw-r-siniva"></span></div>
              <div class="cw-dr"><span>IVA (21%)</span><span id="cw-r-iva"></span></div>
              <div class="cw-dr"><span>Peso efectivo</span><span id="cw-r-peso"></span></div>
              <div class="cw-dr"><span>Modalidad</span><span id="cw-r-modal"></span></div>
              <div class="cw-dr"><span>Pago</span><span id="cw-r-pago"></span></div>
              <div class="cw-dr total"><span>Total con IVA</span><span id="cw-r-total"></span></div>
            </div>
            <div class="cw-seguimiento">
              <p>Tu código de seguimiento</p>
              <div class="cw-codigo" id="cw-codigo">—</div>
              <button class="cw-copy" onclick="cwCopiar()">Copiar código</button>
              <p style="margin-top:8px;font-size:11px">Guardalo para rastrear tu envío</p>
            </div>
            ${emp.telefono ? `<div style="margin-top:14px;font-size:13px;color:rgba(255,255,255,.55)">¿Consultas? <strong style="color:#fff">${emp.telefono}</strong></div>` : ''}
          </div>
        </div>

        <!-- ═══ PANEL TRACKING ═══ -->
        <div class="cw-panel" id="cw-panel-tracking">
          <p style="font-size:14px;color:#6b7280;margin-bottom:16px">Ingresá tu código de seguimiento para ver el estado de tu envío.</p>
          <div class="cw-track-wrap">
            <input type="text" id="cw-track-input" placeholder="Ej: TJ-2025-123456" maxlength="20">
            <button class="cw-track-btn" onclick="cwRastrear()">Rastrear</button>
          </div>
          <div id="cw-track-error"></div>
          <div id="cw-track-result">
            <div class="cw-track-card">
              <span class="cw-track-estado" id="cw-t-estado"></span>
              <div class="cw-track-info">
                <div><p>Número</p><p id="cw-t-num"></p></div>
                <div><p>Servicio</p><p id="cw-t-serv"></p></div>
                <div><p>Origen</p><p id="cw-t-orig"></p></div>
                <div><p>Destino</p><p id="cw-t-dest"></p></div>
                <div><p>Retiro</p><p id="cw-t-retiro"></p></div>
                <div><p>Entrega estimada</p><p id="cw-t-entrega"></p></div>
              </div>
              <div class="cw-stitle">Historial</div>
              <div class="cw-timeline" id="cw-t-timeline"></div>
            </div>
          </div>
        </div>

      </div>
    `;

    // ── Tabs ────────────────────────────────────────────────
    window.cwTab = function(panel, btn) {
      document.querySelectorAll('.cw-panel').forEach(p => p.classList.remove('on'));
      document.querySelectorAll('.cw-tab').forEach(b => b.classList.remove('on'));
      document.getElementById('cw-panel-' + panel).classList.add('on');
      btn.classList.add('on');
    };

    // ── Ciudades ────────────────────────────────────────────
    window.cwCiudades = function(tipo) {
      const prov = document.getElementById('cw-prov-' + tipo).value;
      const sel  = document.getElementById('cw-ciudad-' + tipo);
      const cs   = PROVINCIAS[prov] || [];
      sel.disabled = !cs.length;
      sel.innerHTML = cs.length
        ? '<option value="">— Seleccioná ciudad —</option>' + cs.map(c=>`<option value="${c}">${c}</option>`).join('')
        : '<option value="">— Seleccioná provincia —</option>';
    };

    // ── Volumen ─────────────────────────────────────────────
    window.cwVol = function() {
      const l = parseFloat(document.getElementById('cw-largo').value)||0;
      const a = parseFloat(document.getElementById('cw-ancho').value)||0;
      const h = parseFloat(document.getElementById('cw-alto').value) ||0;
      const b = parseInt(document.getElementById('cw-bultos').value) ||1;
      const info = document.getElementById('cw-vol-info');
      if (l>0&&a>0&&h>0) {
        const vol = (l*a*h/1000000)*b;
        document.getElementById('cw-vol-val').textContent  = vol.toFixed(4);
        document.getElementById('cw-pvol-val').textContent = (vol*250).toFixed(1);
        info.style.display = 'block';
      } else { info.style.display = 'none'; }
    };

    // ── Copiar código ───────────────────────────────────────
    window.cwCopiar = function() {
      const cod = document.getElementById('cw-codigo').textContent;
      navigator.clipboard?.writeText(cod).then(()=>alert('Código copiado: ' + cod));
    };

    // ── Cotizar ─────────────────────────────────────────────
    document.getElementById('cw-btn').addEventListener('click', async function() {
      const provOrigen    = document.getElementById('cw-prov-origen').value;
      const ciudadOrigen  = document.getElementById('cw-ciudad-origen').value;
      const provDestino   = document.getElementById('cw-prov-destino').value;
      const ciudadDestino = document.getElementById('cw-ciudad-destino').value;
      const peso_kg  = parseFloat(document.getElementById('cw-peso').value)||0;
      const largo    = parseFloat(document.getElementById('cw-largo').value)||0;
      const ancho    = parseFloat(document.getElementById('cw-ancho').value)||0;
      const alto     = parseFloat(document.getElementById('cw-alto').value) ||0;
      const bultos   = parseInt(document.getElementById('cw-bultos').value) ||1;
      const servicio = document.getElementById('cw-servicio').value;
      const modalidad= document.getElementById('cw-modalidad').value;
      const pago     = document.getElementById('cw-pago').value;
      const errEl    = document.getElementById('cw-error');
      const resEl    = document.getElementById('cw-result');
      const loadEl   = document.getElementById('cw-loading');

      errEl.style.display='none'; resEl.style.display='none';
      if (!provOrigen||!ciudadOrigen) { errEl.textContent='Seleccioná provincia y ciudad de origen.'; errEl.style.display='block'; return; }
      if (!provDestino||!ciudadDestino) { errEl.textContent='Seleccioná provincia y ciudad de destino.'; errEl.style.display='block'; return; }
      if (!peso_kg) { errEl.textContent='Ingresá el peso del envío.'; errEl.style.display='block'; return; }

      const origen  = `${ciudadOrigen} (${provOrigen})`;
      const destino = `${ciudadDestino} (${provDestino})`;
      const volumen_m3 = largo>0&&ancho>0&&alto>0 ? (largo*ancho*alto/1000000)*bultos : 0;

      this.disabled=true; loadEl.style.display='block';
      try {
        const res  = await fetch(`${API_BASE}/api/widget/${empresa}/cotizar`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({origen, destino, peso_kg, volumen_m3, tipo_servicio:servicio}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error||'Error al cotizar');

        const fmt    = n => '$'+Math.round(n).toLocaleString('es-AR');
        const sinIVA = data.precio_total;
        const iva    = sinIVA*0.21;
        const conIVA = sinIVA*1.21;

        const mLabels = {deposito_sucursal:'Depósito → Sucursal', deposito_domicilio:'Depósito → Domicilio', domicilio_domicilio:'Domicilio → Domicilio'};
        const pLabels = {origen:'Pago en origen', destino:'Pago en destino'};

        document.getElementById('cw-precio').textContent   = fmt(conIVA);
        document.getElementById('cw-plazo').textContent    = '⏱ '+data.plazo;
        document.getElementById('cw-r-siniva').textContent = fmt(sinIVA);
        document.getElementById('cw-r-iva').textContent    = fmt(iva);
        document.getElementById('cw-r-peso').textContent   = data.peso_efectivo_kg+' kg';
        document.getElementById('cw-r-modal').textContent  = mLabels[modalidad];
        document.getElementById('cw-r-pago').textContent   = pLabels[pago];
        document.getElementById('cw-r-total').textContent  = fmt(conIVA);
        document.getElementById('cw-codigo').textContent   = generarCodigo();
        resEl.style.display='block';
      } catch(e) {
        errEl.textContent=e.message; errEl.style.display='block';
      } finally { this.disabled=false; loadEl.style.display='none'; }
    });

    // ── Rastrear ────────────────────────────────────────────
    window.cwRastrear = async function() {
      const num    = document.getElementById('cw-track-input').value.trim().toUpperCase();
      const errEl  = document.getElementById('cw-track-error');
      const resEl  = document.getElementById('cw-track-result');
      errEl.style.display='none'; resEl.style.display='none';
      if (!num) { errEl.textContent='Ingresá el número de seguimiento.'; errEl.style.display='block'; return; }
      try {
        const r = await fetch(`${API_BASE}/api/tracking/${num}`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.error||'No encontrado');

        const e   = d.envio;
        const col = estadoColors[e.estado]||'#6b7280';
        const lbl = estadoLabels[e.estado]||e.estado;
        const fmtF= iso => iso ? new Date(iso).toLocaleDateString('es-AR') : '—';
        const servLabels = {estandar:'Estándar', express:'Express 48h', consolidado:'Consolidado'};

        document.getElementById('cw-t-estado').textContent  = lbl;
        document.getElementById('cw-t-estado').style.background = col+'22';
        document.getElementById('cw-t-estado').style.color  = col;
        document.getElementById('cw-t-num').textContent     = e.numero_seguimiento;
        document.getElementById('cw-t-serv').textContent    = servLabels[e.tipo_servicio]||e.tipo_servicio;
        document.getElementById('cw-t-orig').textContent    = e.origen;
        document.getElementById('cw-t-dest').textContent    = e.destino;
        document.getElementById('cw-t-retiro').textContent  = fmtF(e.fecha_retiro);
        document.getElementById('cw-t-entrega').textContent = fmtF(e.fecha_entrega_estimada);

        document.getElementById('cw-t-timeline').innerHTML = d.eventos.slice().reverse().map(ev => `
          <div class="cw-ev">
            <p>${estadoLabels[ev.estado]||ev.estado}${ev.descripcion?' — '+ev.descripcion:''}</p>
            <small>${ev.ubicacion?'📍 '+ev.ubicacion+' · ':''}${new Date(ev.fecha).toLocaleString('es-AR')}</small>
          </div>`).join('') || '<p style="font-size:13px;color:#6b7280">Sin eventos registrados</p>';

        resEl.style.display='block';
      } catch(e) {
        errEl.textContent=e.message; errEl.style.display='block';
      }
    };

    document.getElementById('cw-track-input').addEventListener('keydown', e => {
      if (e.key==='Enter') cwRastrear();
    });
  }

  fetch(`${API_BASE}/api/widget/${empresa}/config`)
    .then(r=>r.json())
    .then(buildHTML)
    .catch(()=>{
      const el=document.getElementById(containerId);
      if(el) el.innerHTML='<p style="color:red;font-size:13px">Error al cargar el cotizador.</p>';
    });
})();
