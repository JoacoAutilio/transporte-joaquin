(function () {
  const scriptTag = document.currentScript;
  const empresa     = scriptTag.getAttribute('data-empresa') || 'demo';
  const API_BASE    = scriptTag.getAttribute('data-api') || window.location.origin;
  const containerId = scriptTag.getAttribute('data-container') || 'cotizador-widget';

  function injectStyles(c1, c2) {
    if (document.getElementById('cw-styles')) return;
    const s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = `
      #cw-root *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
      #cw-root{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;max-width:580px;width:100%}
      #cw-root h2{font-size:19px;font-weight:800;color:${c2};margin:0 0 20px}
      .cw-row{margin-bottom:14px}
      .cw-row label{display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
      .cw-row select,.cw-row input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#111;outline:none;transition:border-color .2s;background:#fff}
      .cw-row select:focus,.cw-row input:focus{border-color:${c1}}
      .cw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
      .cw-g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px}
      .cw-section{background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:14px}
      .cw-section-title{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
      .cw-vol-calc{font-size:12px;color:#6b7280;margin-top:6px;background:#f3f4f6;padding:6px 10px;border-radius:6px;display:none}
      .cw-vol-calc span{font-weight:700;color:${c1}}
      #cw-btn{width:100%;background:${c1};color:#fff;border:none;padding:13px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;transition:opacity .2s}
      #cw-btn:hover{opacity:.88}#cw-btn:disabled{opacity:.55;cursor:not-allowed}
      #cw-result{margin-top:20px;background:${c2};border-radius:10px;padding:22px;color:#fff;display:none}
      #cw-result .cw-price{font-size:44px;font-weight:800;line-height:1}
      #cw-result .cw-unit{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:14px}
      #cw-result .cw-badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;margin-bottom:16px}
      #cw-result .cw-rows{border-top:1px solid rgba(255,255,255,.15);padding-top:14px;margin-top:8px}
      #cw-result .cw-dr{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.65);padding:4px 0}
      #cw-error{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:10px;display:none}
      #cw-loading{text-align:center;color:#6b7280;font-size:13px;padding:10px;display:none}
    `;
    document.head.appendChild(s);
  }

  function buildHTML(config) {
    const { empresa: emp, origenes, tarifas } = config;
    injectStyles(emp.color_primario, emp.color_secundario || '#0B1E3D');

    const destPor = {};
    tarifas.forEach(t => {
      if (!destPor[t.origen]) destPor[t.origen] = [];
      destPor[t.origen].push(t.destino);
    });

    const container = document.getElementById(containerId);
    if (!container) { console.error('[Widget] No se encontró #' + containerId); return; }

    container.innerHTML = `
      <div id="cw-root">
        <h2>📦 Cotizá tu envío</h2>

        <div class="cw-g2">
          <div class="cw-row">
            <label>Origen</label>
            <select id="cw-origen">
              <option value="">— Seleccioná —</option>
              ${origenes.map(o=>`<option value="${o}">${o}</option>`).join('')}
            </select>
          </div>
          <div class="cw-row">
            <label>Destino</label>
            <select id="cw-destino" disabled>
              <option value="">— Primero elegí origen —</option>
            </select>
          </div>
        </div>

        <!-- PESO -->
        <div class="cw-section">
          <div class="cw-section-title">⚖️ Peso y dimensiones</div>
          <div class="cw-g2">
            <div class="cw-row">
              <label>Peso (kg) *</label>
              <input type="number" id="cw-peso" placeholder="0" min="0.1" step="0.1" oninput="cwCalcVol()">
            </div>
            <div class="cw-row">
              <label>Cantidad de bultos</label>
              <input type="number" id="cw-bultos" placeholder="1" min="1" step="1" value="1">
            </div>
          </div>
          <div class="cw-section-title" style="margin-top:4px">📐 Dimensiones por bulto (cm) — opcional</div>
          <div class="cw-g3">
            <div class="cw-row"><label>Largo (cm)</label><input type="number" id="cw-largo" placeholder="0" min="0" step="1" oninput="cwCalcVol()"></div>
            <div class="cw-row"><label>Ancho (cm)</label><input type="number" id="cw-ancho" placeholder="0" min="0" step="1" oninput="cwCalcVol()"></div>
            <div class="cw-row"><label>Alto (cm)</label><input type="number"  id="cw-alto"  placeholder="0" min="0" step="1" oninput="cwCalcVol()"></div>
          </div>
          <div class="cw-vol-calc" id="cw-vol-info">
            Volumen total: <span id="cw-vol-val">—</span> m³ · Peso volumétrico: <span id="cw-peso-vol-val">—</span> kg
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
            <div class="cw-dr"><span>Peso efectivo</span><span id="cw-r-pesof"></span></div>
            <div class="cw-dr"><span>Volumen total</span><span id="cw-r-vol"></span></div>
            <div class="cw-dr"><span>Servicio</span><span id="cw-r-serv"></span></div>
          </div>
          ${emp.telefono ? `<div style="margin-top:14px;font-size:13px;color:rgba(255,255,255,.55)">¿Consultas? <strong style="color:#fff">${emp.telefono}</strong></div>` : ''}
        </div>
      </div>
    `;

    // Calcular volumen en tiempo real
    window.cwCalcVol = function() {
      const largo  = parseFloat(document.getElementById('cw-largo').value) || 0;
      const ancho  = parseFloat(document.getElementById('cw-ancho').value) || 0;
      const alto   = parseFloat(document.getElementById('cw-alto').value) || 0;
      const bultos = parseInt(document.getElementById('cw-bultos').value) || 1;
      const info   = document.getElementById('cw-vol-info');

      if (largo > 0 && ancho > 0 && alto > 0) {
        // cm³ → m³, multiplicado por bultos
        const volM3 = (largo * ancho * alto) / 1000000 * bultos;
        const pesoVol = volM3 * 250; // regla volumétrica 1m³ = 250kg
        document.getElementById('cw-vol-val').textContent = volM3.toFixed(4);
        document.getElementById('cw-peso-vol-val').textContent = pesoVol.toFixed(1);
        info.style.display = 'block';
      } else {
        info.style.display = 'none';
      }
    };

    // Actualizar destinos
    document.getElementById('cw-origen').addEventListener('change', function() {
      const ds = destPor[this.value] || [];
      const sel = document.getElementById('cw-destino');
      sel.disabled = !ds.length;
      sel.innerHTML = ds.length
        ? '<option value="">— Seleccioná —</option>' + ds.map(d=>`<option value="${d}">${d}</option>`).join('')
        : '<option value="">— Sin destinos disponibles —</option>';
      document.getElementById('cw-result').style.display = 'none';
    });

    // Cotizar
    document.getElementById('cw-btn').addEventListener('click', async function() {
      const origen   = document.getElementById('cw-origen').value;
      const destino  = document.getElementById('cw-destino').value;
      const peso_kg  = parseFloat(document.getElementById('cw-peso').value) || 0;
      const largo    = parseFloat(document.getElementById('cw-largo').value) || 0;
      const ancho    = parseFloat(document.getElementById('cw-ancho').value) || 0;
      const alto     = parseFloat(document.getElementById('cw-alto').value) || 0;
      const bultos   = parseInt(document.getElementById('cw-bultos').value) || 1;
      const servicio = document.getElementById('cw-servicio').value;
      const errEl    = document.getElementById('cw-error');
      const resEl    = document.getElementById('cw-result');
      const loadEl   = document.getElementById('cw-loading');

      errEl.style.display = 'none';
      resEl.style.display = 'none';

      if (!origen || !destino) { errEl.textContent = 'Seleccioná origen y destino.'; errEl.style.display='block'; return; }
      if (!peso_kg) { errEl.textContent = 'Ingresá el peso del envío.'; errEl.style.display='block'; return; }

      // Calcular volumen en m³
      const volumen_m3 = largo > 0 && ancho > 0 && alto > 0
        ? (largo * ancho * alto / 1000000) * bultos
        : 0;

      this.disabled = true;
      loadEl.style.display = 'block';

      try {
        const res = await fetch(`${API_BASE}/api/widget/${empresa}/cotizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origen, destino, peso_kg, volumen_m3, tipo_servicio: servicio }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cotizar');

        const fmt = n => "$" + Math.round(n).toLocaleString("es-AR");
        const servLabels = { estandar:'Estándar', express:'Express 48h', consolidado:'Consolidado' };

        const precioConIVA = data.precio_total * 1.21;
        document.getElementById("cw-precio").textContent = fmt(precioConIVA);
        document.getElementById('cw-plazo').textContent  = '⏱ ' + data.plazo;
        document.getElementById("cw-r-pesof").textContent = data.peso_efectivo_kg + " kg";
        document.getElementById("cw-r-siniva").textContent = fmt(data.precio_total);
        document.getElementById("cw-r-iva").textContent = fmt(data.precio_total * 0.21);
        document.getElementById('cw-r-vol').textContent   = volumen_m3 > 0 ? volumen_m3.toFixed(4) + ' m³' : '—';
        document.getElementById('cw-r-serv').textContent  = servLabels[data.tipo_servicio];
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
      console.error('[Widget]', e);
    });
})();