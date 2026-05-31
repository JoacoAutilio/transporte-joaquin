(function () {
  const scriptTag   = document.currentScript;
  const empresa     = scriptTag.getAttribute('data-empresa') || 'demo';
  const API_BASE    = scriptTag.getAttribute('data-api') || window.location.origin;
  const containerId = scriptTag.getAttribute('data-container') || 'cotizador-widget';

  const PROVINCIAS = {
    "Buenos Aires": ["AMBA / Gran Buenos Aires","La Plata","Mar del Plata","Bahía Blanca","Tandil","Quilmes","Lomas de Zamora","Lanús","General San Martín","Morón","Tigre","San Isidro","Vicente López","Tres de Febrero","Merlo","Moreno","La Matanza","Almirante Brown","Florencio Varela","Berazategui","Avellaneda","Zárate","Campana","Junín","Pergamino","Necochea","Olavarría","Azul","Pehuajó","9 de Julio"],
    "CABA": ["Ciudad Autónoma de Buenos Aires"],
    "Córdoba": ["Córdoba Capital","Río Cuarto","Villa María","San Francisco","Alta Gracia","Bell Ville","Villa Carlos Paz","Cosquín","Jesús María","Oncativo","Marcos Juárez","La Falda","Cruz del Eje"],
    "Santa Fe": ["Rosario","Santa Fe Capital","Rafaela","Venado Tuerto","Santo Tomé","Reconquista","Esperanza","Casilda","Cañada de Gómez","Gálvez"],
    "Mendoza": ["Mendoza Capital","San Rafael","Godoy Cruz","Luján de Cuyo","Maipú","Rivadavia","Tunuyán","Malargüe","Las Heras"],
    "Tucumán": ["San Miguel de Tucumán","Concepción","Banda del Río Salí","Yerba Buena","Aguilares","Monteros","Tafí Viejo"],
    "Salta": ["Salta Capital","San Ramón de la Nueva Orán","Tartagal","Metán","Rosario de la Frontera","Cafayate","General Güemes"],
    "Misiones": ["Posadas","Oberá","Eldorado","Puerto Iguazú","Apóstoles","Leandro N. Alem","Jardín América"],
    "Entre Ríos": ["Paraná","Concordia","Gualeguaychú","Concepción del Uruguay","Gualeguay","Villaguay","Chajarí"],
    "Chaco": ["Resistencia","Presidencia Roque Sáenz Peña","Villa Ángela","Charata","Barranqueras","Las Breñas"],
    "Corrientes": ["Corrientes Capital","Goya","Paso de los Libres","Curuzú Cuatiá","Mercedes","Santo Tomé","Bella Vista"],
    "Jujuy": ["San Salvador de Jujuy","Palpalá","San Pedro de Jujuy","Libertador General San Martín","Humahuaca","Tilcara"],
    "Río Negro": ["Viedma","Bariloche","Cipolletti","General Roca","Allen","Río Colorado","El Bolsón","Choele Choel"],
    "Neuquén": ["Neuquén Capital","Cutral-Có","Plaza Huincul","Zapala","San Martín de los Andes","Villa La Angostura","Junín de los Andes"],
    "San Juan": ["San Juan Capital","Rawson","Chimbas","Rivadavia","Santa Lucía","Caucete","Villa Krause"],
    "San Luis": ["San Luis Capital","Villa Mercedes","Merlo","Concarán","Justo Daract","Quines"],
    "La Pampa": ["Santa Rosa","General Pico","Toay","Eduardo Castex","General Acha","Victorica"],
    "Formosa": ["Formosa Capital","Clorinda","Pirané","General Lucio Victorio Mansilla"],
    "Catamarca": ["San Fernando del Valle de Catamarca","Tinogasta","Andalgalá","Belén","Santa María","Recreo"],
    "La Rioja": ["La Rioja Capital","Chilecito","Aimogasta","Chepes","Chamical"],
    "Santiago del Estero": ["Santiago del Estero Capital","La Banda","Termas de Río Hondo","Añatuya","Frías","Loreto"],
    "Chubut": ["Rawson","Comodoro Rivadavia","Puerto Madryn","Trelew","Esquel","Rada Tilly","Sarmiento"],
    "Santa Cruz": ["Río Gallegos","Caleta Olivia","Pico Truncado","Puerto Deseado","Las Heras","El Calafate","Gobernador Gregores"],
    "Tierra del Fuego": ["Ushuaia","Río Grande","Tolhuin"],
  };

  const MODALIDADES = [
    { value: "deposito_sucursal",  label: "Entrega en depósito → Retiro en sucursal" },
    { value: "deposito_domicilio", label: "Entrega en depósito → Entrega a domicilio" },
    { value: "domicilio_domicilio",label: "Retiro a domicilio → Entrega a domicilio" },
  ];

  const PAGOS = [
    { value: "origen",  label: "Pago en origen (quien envía)" },
    { value: "destino", label: "Pago en destino (quien recibe)" },
  ];

  function injectStyles(c1, c2) {
    if (document.getElementById('cw-styles')) return;
    const s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = `
      #cw-root *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
      #cw-root{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;max-width:600px;width:100%}
      #cw-root h2{font-size:19px;font-weight:800;color:${c2};margin:0 0 20px}
      .cw-row{margin-bottom:14px}
      .cw-row label{display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
      .cw-row select,.cw-row input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#111;outline:none;transition:border-color .2s;background:#fff}
      .cw-row select:focus,.cw-row input:focus{border-color:${c1}}
      .cw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
      .cw-section{background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:14px}
      .cw-section-title{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
      .cw-vol-info{font-size:12px;color:#6b7280;margin-top:6px;background:#f3f4f6;padding:6px 10px;border-radius:6px;display:none}
      .cw-vol-info span{font-weight:700;color:${c1}}
      #cw-btn{width:100%;background:${c1};color:#fff;border:none;padding:13px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;transition:opacity .2s}
      #cw-btn:hover{opacity:.88}#cw-btn:disabled{opacity:.55;cursor:not-allowed}
      #cw-result{margin-top:20px;background:${c2};border-radius:10px;padding:22px;color:#fff;display:none}
      #cw-result .cw-price{font-size:44px;font-weight:800;line-height:1}
      #cw-result .cw-unit{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:14px}
      #cw-result .cw-badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;margin-bottom:16px}
      #cw-result .cw-rows{border-top:1px solid rgba(255,255,255,.15);padding-top:14px;margin-top:8px}
      #cw-result .cw-dr{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.65);padding:4px 0}
      #cw-result .cw-dr.total{color:#fff;font-weight:700;font-size:15px;border-top:1px solid rgba(255,255,255,.2);margin-top:6px;padding-top:10px}
      #cw-error{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:10px;display:none}
      #cw-loading{text-align:center;color:#6b7280;font-size:13px;padding:10px;display:none}
    `;
    document.head.appendChild(s);
  }

  function buildHTML(config) {
    const { empresa: emp } = config;
    injectStyles(emp.color_primario, emp.color_secundario || '#0B1E3D');

    const provOptions = Object.keys(PROVINCIAS).map(p =>
      `<option value="${p}">${p}</option>`
    ).join('');

    const container = document.getElementById(containerId);
    if (!container) { console.error('[Widget] No se encontró #' + containerId); return; }

    container.innerHTML = `
      <div id="cw-root">
        <h2>📦 Cotizá tu envío</h2>

        <!-- ORIGEN -->
        <div class="cw-section">
          <div class="cw-section-title">📍 Origen</div>
          <div class="cw-g2">
            <div class="cw-row"><label>Provincia</label>
              <select id="cw-prov-origen" onchange="cwUpdateCiudades('origen')">
                <option value="">— Seleccioná —</option>${provOptions}
              </select>
            </div>
            <div class="cw-row"><label>Ciudad</label>
              <select id="cw-ciudad-origen" disabled><option value="">— Primero elegí provincia —</option></select>
            </div>
          </div>
        </div>

        <!-- DESTINO -->
        <div class="cw-section">
          <div class="cw-section-title">🏁 Destino</div>
          <div class="cw-g2">
            <div class="cw-row"><label>Provincia</label>
              <select id="cw-prov-destino" onchange="cwUpdateCiudades('destino')">
                <option value="">— Seleccioná —</option>${provOptions}
              </select>
            </div>
            <div class="cw-row"><label>Ciudad</label>
              <select id="cw-ciudad-destino" disabled><option value="">— Primero elegí provincia —</option></select>
            </div>
          </div>
        </div>

        <!-- MODALIDAD Y PAGO -->
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
              ${PAGOS.map(p=>`<option value="${p.value}">${p.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- PESO Y DIMENSIONES -->
        <div class="cw-section">
          <div class="cw-section-title">⚖️ Peso y dimensiones</div>
          <div class="cw-g2">
            <div class="cw-row"><label>Peso (kg) *</label>
              <input type="number" id="cw-peso" placeholder="0" min="0.1" step="0.1" oninput="cwCalcVol()">
            </div>
            <div class="cw-row"><label>Cantidad de bultos</label>
              <input type="number" id="cw-bultos" placeholder="1" min="1" value="1" oninput="cwCalcVol()">
            </div>
          </div>
          <div class="cw-section-title" style="margin-top:4px">📐 Dimensiones por bulto en cm (opcional)</div>
          <div class="cw-g3">
            <div class="cw-row"><label>Largo (cm)</label><input type="number" id="cw-largo" placeholder="0" min="0" oninput="cwCalcVol()"></div>
            <div class="cw-row"><label>Ancho (cm)</label><input type="number" id="cw-ancho" placeholder="0" min="0" oninput="cwCalcVol()"></div>
            <div class="cw-row"><label>Alto (cm)</label><input type="number"  id="cw-alto"  placeholder="0" min="0" oninput="cwCalcVol()"></div>
          </div>
          <div class="cw-vol-info" id="cw-vol-info">
            Volumen: <span id="cw-vol-val">—</span> m³ · Peso volumétrico: <span id="cw-pvol-val">—</span> kg
          </div>
        </div>

        <!-- SERVICIO -->
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
          ${emp.telefono ? `<div style="margin-top:14px;font-size:13px;color:rgba(255,255,255,.55)">¿Consultas? <strong style="color:#fff">${emp.telefono}</strong></div>` : ''}
        </div>
      </div>
    `;

    // Actualizar ciudades según provincia
    window.cwUpdateCiudades = function(tipo) {
      const prov = document.getElementById('cw-prov-' + tipo).value;
      const ciudadSel = document.getElementById('cw-ciudad-' + tipo);
      const ciudades = PROVINCIAS[prov] || [];
      ciudadSel.disabled = !ciudades.length;
      ciudadSel.innerHTML = ciudades.length
        ? '<option value="">— Seleccioná ciudad —</option>' + ciudades.map(c => `<option value="${c}">${c}</option>`).join('')
        : '<option value="">— Seleccioná provincia primero —</option>';
    };

    // Calcular volumen
    window.cwCalcVol = function() {
      const l = parseFloat(document.getElementById('cw-largo').value) || 0;
      const a = parseFloat(document.getElementById('cw-ancho').value) || 0;
      const h = parseFloat(document.getElementById('cw-alto').value)  || 0;
      const b = parseInt(document.getElementById('cw-bultos').value)  || 1;
      const info = document.getElementById('cw-vol-info');
      if (l > 0 && a > 0 && h > 0) {
        const vol = (l * a * h / 1000000) * b;
        const pv  = vol * 250;
        document.getElementById('cw-vol-val').textContent  = vol.toFixed(4);
        document.getElementById('cw-pvol-val').textContent = pv.toFixed(1);
        info.style.display = 'block';
      } else { info.style.display = 'none'; }
    };

    // Cotizar
    document.getElementById('cw-btn').addEventListener('click', async function() {
      const provOrigen   = document.getElementById('cw-prov-origen').value;
      const ciudadOrigen = document.getElementById('cw-ciudad-origen').value;
      const provDestino  = document.getElementById('cw-prov-destino').value;
      const ciudadDestino= document.getElementById('cw-ciudad-destino').value;
      const peso_kg  = parseFloat(document.getElementById('cw-peso').value) || 0;
      const largo    = parseFloat(document.getElementById('cw-largo').value) || 0;
      const ancho    = parseFloat(document.getElementById('cw-ancho').value) || 0;
      const alto     = parseFloat(document.getElementById('cw-alto').value)  || 0;
      const bultos   = parseInt(document.getElementById('cw-bultos').value)  || 1;
      const servicio = document.getElementById('cw-servicio').value;
      const modalidad= document.getElementById('cw-modalidad').value;
      const pago     = document.getElementById('cw-pago').value;
      const errEl    = document.getElementById('cw-error');
      const resEl    = document.getElementById('cw-result');
      const loadEl   = document.getElementById('cw-loading');

      errEl.style.display = 'none';
      resEl.style.display = 'none';

      if (!provOrigen || !ciudadOrigen) { errEl.textContent = 'Seleccioná provincia y ciudad de origen.'; errEl.style.display='block'; return; }
      if (!provDestino || !ciudadDestino) { errEl.textContent = 'Seleccioná provincia y ciudad de destino.'; errEl.style.display='block'; return; }
      if (!peso_kg) { errEl.textContent = 'Ingresá el peso del envío.'; errEl.style.display='block'; return; }

      const origen  = `${ciudadOrigen} (${provOrigen})`;
      const destino = `${ciudadDestino} (${provDestino})`;
      const volumen_m3 = largo > 0 && ancho > 0 && alto > 0 ? (largo * ancho * alto / 1000000) * bultos : 0;

      this.disabled = true; loadEl.style.display = 'block';

      try {
        const res = await fetch(`${API_BASE}/api/widget/${empresa}/cotizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origen, destino, peso_kg, volumen_m3, tipo_servicio: servicio }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cotizar');

        const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
        const sinIVA    = data.precio_total;
        const iva       = sinIVA * 0.21;
        const conIVA    = sinIVA * 1.21;

        const modalLabels = {
          deposito_sucursal:  'Depósito → Sucursal',
          deposito_domicilio: 'Depósito → Domicilio',
          domicilio_domicilio:'Domicilio → Domicilio',
        };
        const pagoLabels = { origen:'Pago en origen', destino:'Pago en destino' };

        document.getElementById('cw-precio').textContent    = fmt(conIVA);
        document.getElementById('cw-plazo').textContent     = '⏱ ' + data.plazo;
        document.getElementById('cw-r-siniva').textContent  = fmt(sinIVA);
        document.getElementById('cw-r-iva').textContent     = fmt(iva);
        document.getElementById('cw-r-peso').textContent    = data.peso_efectivo_kg + ' kg';
        document.getElementById('cw-r-modal').textContent   = modalLabels[modalidad];
        document.getElementById('cw-r-pago').textContent    = pagoLabels[pago];
        document.getElementById('cw-r-total').textContent   = fmt(conIVA);
        resEl.style.display = 'block';
      } catch(e) {
        errEl.textContent = e.message;
        errEl.style.display = 'block';
      } finally {
        this.disabled = false;
        loadEl.style.display = 'none';
      }
    });
  }

  fetch(`${API_BASE}/api/widget/${empresa}/config`)
    .then(r => r.json())
    .then(buildHTML)
    .catch(e => {
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = '<p style="color:red;font-size:13px">Error al cargar el cotizador.</p>';
    });
})();