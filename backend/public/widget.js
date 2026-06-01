(function () {
  var scriptTag   = document.currentScript;
  var empresa     = scriptTag.getAttribute('data-empresa') || 'demo';
  var API_BASE    = scriptTag.getAttribute('data-api') || window.location.origin;
  var containerId = scriptTag.getAttribute('data-container') || 'cotizador-widget';

  var PROVINCIAS = {
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
    "Tierra del Fuego": ["Ushuaia","Río Grande","Tolhuin"]
  };

  var MODALIDADES = [
    { value: "deposito_sucursal",   label: "Entrega en depósito → Retiro en sucursal" },
    { value: "deposito_domicilio",  label: "Entrega en depósito → Entrega a domicilio" },
    { value: "domicilio_domicilio", label: "Retiro a domicilio → Entrega a domicilio" }
  ];

  var ESTADO_LABELS = {
    confirmado: "Confirmado", en_transito: "En tránsito",
    en_destino: "En destino", entregado: "Entregado",
    cancelado: "Cancelado",   presupuesto: "Presupuesto"
  };

  var ESTADO_COLORS = {
    confirmado: "#3b82f6", en_transito: "#f59e0b",
    en_destino: "#8b5cf6", entregado: "#16a34a",
    cancelado: "#dc2626",  presupuesto: "#6b7280"
  };

  function generarCodigo() {
    var año  = new Date().getFullYear();
    var rand = Math.floor(100000 + Math.random() * 900000);
    return "TJ-" + año + "-" + rand;
  }

  function fmt(n) {
    return "$" + Math.round(n).toLocaleString("es-AR");
  }

  function injectStyles(c1, c2) {
    if (document.getElementById("cw-styles")) return;
    var s = document.createElement("style");
    s.id = "cw-styles";
    s.textContent = [
      "#cw-root *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}",
      "#cw-root{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;max-width:640px;width:100%}",
      "#cw-root h2{font-size:19px;font-weight:800;color:" + c2 + ";margin:0 0 6px}",
      ".cw-tabs{display:flex;margin-bottom:20px;border:1.5px solid #e5e7eb;border-radius:8px;overflow:hidden}",
      ".cw-tab{flex:1;padding:9px;font-size:13px;font-weight:600;background:#f9fafb;border:none;cursor:pointer;color:#6b7280;font-family:inherit;transition:all .15s}",
      ".cw-tab.on{background:" + c1 + ";color:#fff}",
      ".cw-panel{display:none}.cw-panel.on{display:block}",
      ".cw-row{margin-bottom:14px}",
      ".cw-row label{display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}",
      ".cw-row select,.cw-row input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#111;outline:none;transition:border-color .2s;background:#fff}",
      ".cw-row select:focus,.cw-row input:focus{border-color:" + c1 + "}",
      ".cw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
      ".cw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}",
      ".cw-section{background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:14px}",
      ".cw-stitle{font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}",
      ".cw-vol-info{font-size:12px;color:#6b7280;margin-top:6px;background:#f3f4f6;padding:6px 10px;border-radius:6px;display:none}",
      "#cw-btn{width:100%;background:" + c1 + ";color:#fff;border:none;padding:13px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px}",
      "#cw-btn:disabled{opacity:.55;cursor:not-allowed}",
      "#cw-result{margin-top:20px;background:" + c2 + ";border-radius:10px;padding:22px;color:#fff;display:none}",
      ".cw-price{font-size:44px;font-weight:800;line-height:1}",
      ".cw-unit{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:14px}",
      ".cw-badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;margin-bottom:16px}",
      ".cw-rows{border-top:1px solid rgba(255,255,255,.15);padding-top:14px;margin-top:8px}",
      ".cw-dr{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.65);padding:4px 0;gap:8px}",
      ".cw-dr span:last-child{text-align:right;max-width:60%}",
      ".cw-dr.total{color:#fff;font-weight:700;font-size:15px;border-top:1px solid rgba(255,255,255,.2);margin-top:6px;padding-top:10px}",
      ".cw-seguimiento{margin-top:16px;background:rgba(255,255,255,.1);border-radius:8px;padding:14px;text-align:center}",
      ".cw-seguimiento p{font-size:12px;color:rgba(255,255,255,.6);margin-bottom:6px}",
      ".cw-codigo{font-size:22px;font-weight:800;letter-spacing:2px;color:#fff}",
      ".cw-copy{background:rgba(255,255,255,.15);border:none;color:#fff;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;margin-top:6px;font-family:inherit}",
      "#cw-error{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:10px;display:none}",
      "#cw-loading{text-align:center;color:#6b7280;font-size:13px;padding:10px;display:none}",
      ".cw-sn-btn{white-space:nowrap;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;background:#f9fafb;font-size:12px;font-weight:600;cursor:pointer;color:#6b7280;font-family:inherit;transition:all .15s}",
      ".cw-sn-btn.on{background:" + c1 + ";color:#fff;border-color:" + c1 + "}",
      ".cw-num-wrap{display:flex;gap:8px;align-items:center}",
      ".cw-num-wrap input{flex:1}",
      ".cw-track-wrap{display:flex;gap:8px;margin-bottom:16px}",
      ".cw-track-wrap input{flex:1;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;text-transform:uppercase}",
      ".cw-track-wrap input:focus{border-color:" + c1 + "}",
      ".cw-track-btn{background:" + c1 + ";color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}",
      "#cw-track-result{display:none}",
      ".cw-track-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px}",
      ".cw-track-estado{display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:14px}",
      ".cw-tinfo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}",
      ".cw-tinfo div p:first-child{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;font-weight:600}",
      ".cw-tinfo div p:last-child{font-size:14px;font-weight:600;color:#111;margin-top:2px}",
      ".cw-timeline{border-left:2px solid #e5e7eb;padding-left:16px;margin-top:8px}",
      ".cw-ev{position:relative;margin-bottom:14px}",
      ".cw-ev::before{content:'';position:absolute;left:-21px;top:4px;width:10px;height:10px;border-radius:50%;background:" + c1 + ";border:2px solid #fff;box-shadow:0 0 0 2px " + c1 + "}",
      ".cw-ev p{font-size:13px;font-weight:600;color:#111}",
      ".cw-ev small{font-size:12px;color:#6b7280}",
      "#cw-track-error{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;display:none;margin-top:10px}"
    ].join("");
    document.head.appendChild(s);
  }

  function provOptions() {
    return Object.keys(PROVINCIAS).map(function(p) {
      return '<option value="' + p + '">' + p + '</option>';
    }).join("");
  }

  function modalOptions() {
    return MODALIDADES.map(function(m) {
      return '<option value="' + m.value + '">' + m.label + '</option>';
    }).join("");
  }

  function dirFields(pre, titulo) {
    return [
      '<div class="cw-section">',
      '<div class="cw-stitle">' + titulo + '</div>',
      '<div class="cw-g2">',
        '<div class="cw-row"><label>Tipo</label>',
          '<select id="cw-' + pre + '-tipo" onchange="cwTipoDoc(\'' + pre + '\')">',
            '<option value="particular">Persona particular</option>',
            '<option value="empresa">Empresa</option>',
          '</select>',
        '</div>',
        '<div class="cw-row" id="cw-' + pre + '-ap-row"><label>Apellido *</label>',
          '<input id="cw-' + pre + '-ap" placeholder="Pérez">',
        '</div>',
      '</div>',
      '<div class="cw-g2">',
        '<div class="cw-row"><label id="cw-' + pre + '-nom-lbl">Nombre *</label>',
          '<input id="cw-' + pre + '-nom" placeholder="Juan">',
        '</div>',
        '<div class="cw-row"><label id="cw-' + pre + '-doc-lbl">DNI *</label>',
          '<input id="cw-' + pre + '-doc" placeholder="28456789">',
        '</div>',
      '</div>',
      '<div class="cw-g2">',
        '<div class="cw-row"><label>Celular *</label>',
          '<input id="cw-' + pre + '-cel" type="tel" placeholder="11-1234-5678">',
        '</div>',
        '<div class="cw-row"><label>Email</label>',
          '<input id="cw-' + pre + '-email" type="email" placeholder="mail@ejemplo.com">',
        '</div>',
      '</div>',
      '<div class="cw-g2">',
        '<div class="cw-row"><label>Calle *</label>',
          '<input id="cw-' + pre + '-calle" placeholder="Av. San Martín">',
        '</div>',
        '<div class="cw-row"><label>Número *</label>',
          '<div class="cw-num-wrap">',
            '<input id="cw-' + pre + '-num" placeholder="1234" oninput="cwCheckSN(\'' + pre + '\')">',
            '<button type="button" class="cw-sn-btn" id="cw-' + pre + '-sn" onclick="cwToggleSN(\'' + pre + '\')">S/N</button>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="cw-g2">',
        '<div class="cw-row"><label>Entre calles (opcional)</label>',
          '<input id="cw-' + pre + '-entre" placeholder="Ej: Corrientes y Callao">',
        '</div>',
        '<div class="cw-row"><label>Código postal *</label>',
          '<input id="cw-' + pre + '-cp" placeholder="1406" maxlength="8">',
        '</div>',
      '</div>',
      '</div>'
    ].join("");
  }

  function buildHTML(config) {
    var emp = config.empresa;
    var c1  = emp.color_primario  || "#E8500A";
    var c2  = emp.color_secundario || "#0B1E3D";
    injectStyles(c1, c2);

    var po = provOptions();
    var mo = modalOptions();

    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = [
      '<div id="cw-root">',
        '<h2>📦 ' + (emp.nombre || "Cotizador de envíos") + '</h2>',
        '<div class="cw-tabs">',
          '<button class="cw-tab on" onclick="cwTab(\'cotizar\',this)">Cotizar envío</button>',
          '<button class="cw-tab" onclick="cwTab(\'tracking\',this)">Rastrear envío</button>',
        '</div>',

        // ── PANEL COTIZAR ──
        '<div class="cw-panel on" id="cw-panel-cotizar">',

          // Origen
          '<div class="cw-section">',
            '<div class="cw-stitle">📍 Origen</div>',
            '<div class="cw-g2">',
              '<div class="cw-row"><label>Provincia</label>',
                '<select id="cw-prov-origen" onchange="cwCiudades(\'origen\')">',
                  '<option value="">— Seleccioná —</option>' + po,
                '</select></div>',
              '<div class="cw-row"><label>Ciudad</label>',
                '<select id="cw-ciudad-origen" disabled>',
                  '<option value="">— Primero provincia —</option>',
                '</select></div>',
            '</div>',
          '</div>',

          // Destino
          '<div class="cw-section">',
            '<div class="cw-stitle">🏁 Destino</div>',
            '<div class="cw-g2">',
              '<div class="cw-row"><label>Provincia</label>',
                '<select id="cw-prov-destino" onchange="cwCiudades(\'destino\')">',
                  '<option value="">— Seleccioná —</option>' + po,
                '</select></div>',
              '<div class="cw-row"><label>Ciudad</label>',
                '<select id="cw-ciudad-destino" disabled>',
                  '<option value="">— Primero provincia —</option>',
                '</select></div>',
            '</div>',
          '</div>',

          // Modalidad y pago
          '<div class="cw-g2">',
            '<div class="cw-row"><label>Modalidad de envío</label>',
              '<select id="cw-modalidad">' + mo + '</select>',
            '</div>',
            '<div class="cw-row"><label>Forma de pago</label>',
              '<select id="cw-pago">',
                '<option value="origen">Pago en origen (quien envía)</option>',
                '<option value="destino">Pago en destino (quien recibe)</option>',
              '</select>',
            '</div>',
          '</div>',

          // Peso y dimensiones
          '<div class="cw-section">',
            '<div class="cw-stitle">⚖️ Peso y dimensiones</div>',
            '<div class="cw-g2">',
              '<div class="cw-row"><label>Peso (kg) *</label>',
                '<input type="number" id="cw-peso" placeholder="0" min="0.1" step="0.1" oninput="cwVol()">',
              '</div>',
              '<div class="cw-row"><label>Cantidad de bultos</label>',
                '<input type="number" id="cw-bultos" placeholder="1" min="1" value="1" oninput="cwVol()">',
              '</div>',
            '</div>',
            '<div class="cw-stitle" style="margin-top:4px">📐 Dimensiones por bulto en cm (opcional)</div>',
            '<div class="cw-g3">',
              '<div class="cw-row"><label>Largo</label><input type="number" id="cw-largo" placeholder="0" min="0" oninput="cwVol()"></div>',
              '<div class="cw-row"><label>Ancho</label><input type="number" id="cw-ancho" placeholder="0" min="0" oninput="cwVol()"></div>',
              '<div class="cw-row"><label>Alto</label><input type="number" id="cw-alto" placeholder="0" min="0" oninput="cwVol()"></div>',
            '</div>',
            '<div class="cw-vol-info" id="cw-vol-info">',
              'Volumen: <span id="cw-vol-val">—</span> m³ · Peso vol.: <span id="cw-pvol-val">—</span> kg',
            '</div>',
          '</div>',

          // Tipo servicio
          '<div class="cw-row"><label>Tipo de servicio</label>',
            '<select id="cw-servicio">',
              '<option value="estandar">Estándar (3–5 días hábiles)</option>',
              '<option value="express">Express 48 hs hábiles (+35%)</option>',
              '<option value="consolidado">Consolidado (–15%)</option>',
            '</select>',
          '</div>',

          // Remitente
          dirFields("rem", "👤 Remitente (quien envía)"),

          // Destinatario
          dirFields("dest", "📬 Destinatario (quien recibe)"),

          '<button id="cw-btn">Calcular precio →</button>',
          '<div id="cw-loading">Calculando...</div>',
          '<div id="cw-error"></div>',

          // Resultado
          '<div id="cw-result">',
            '<div class="cw-price" id="cw-precio"></div>',
            '<div class="cw-unit">ARS · IVA incluido (21%) · Precio referencial</div>',
            '<div class="cw-badge" id="cw-plazo"></div>',
            '<div class="cw-rows">',
              '<div class="cw-dr"><span>Precio sin IVA</span><span id="cw-r-siniva"></span></div>',
              '<div class="cw-dr"><span>IVA (21%)</span><span id="cw-r-iva"></span></div>',
              '<div class="cw-dr"><span>Peso efectivo</span><span id="cw-r-peso"></span></div>',
              '<div class="cw-dr"><span>Modalidad</span><span id="cw-r-modal"></span></div>',
              '<div class="cw-dr"><span>Pago</span><span id="cw-r-pago"></span></div>',
              '<div class="cw-dr"><span>Remitente</span><span id="cw-r-rem"></span></div>',
              '<div class="cw-dr"><span>Dir. retiro</span><span id="cw-r-dir-rem"></span></div>',
              '<div class="cw-dr"><span>Destinatario</span><span id="cw-r-dest"></span></div>',
              '<div class="cw-dr"><span>Dir. entrega</span><span id="cw-r-dir-dest"></span></div>',
              '<div class="cw-dr total"><span>Total con IVA</span><span id="cw-r-total"></span></div>',
            '</div>',
            '<div class="cw-seguimiento">',
              '<p>Tu código de seguimiento</p>',
              '<div class="cw-codigo" id="cw-codigo">—</div>',
              '<button class="cw-copy" onclick="cwCopiar()">Copiar código</button>',
              '<p style="margin-top:8px;font-size:11px">Guardalo para rastrear tu envío</p>',
            '</div>',
            emp.telefono ? '<div style="margin-top:14px;font-size:13px;color:rgba(255,255,255,.55)">¿Consultas? <strong style="color:#fff">' + emp.telefono + '</strong></div>' : '',
          '</div>',

        '</div>', // fin panel cotizar

        // ── PANEL TRACKING ──
        '<div class="cw-panel" id="cw-panel-tracking">',
          '<p style="font-size:14px;color:#6b7280;margin-bottom:16px">Ingresá tu código de seguimiento para ver el estado de tu envío.</p>',
          '<div class="cw-track-wrap">',
            '<input type="text" id="cw-track-input" placeholder="Ej: TJ-2025-123456" maxlength="20">',
            '<button class="cw-track-btn" onclick="cwRastrear()">Rastrear</button>',
          '</div>',
          '<div id="cw-track-error"></div>',
          '<div id="cw-track-result">',
            '<div class="cw-track-card">',
              '<span class="cw-track-estado" id="cw-t-estado"></span>',
              '<div class="cw-tinfo">',
                '<div><p>Número</p><p id="cw-t-num"></p></div>',
                '<div><p>Servicio</p><p id="cw-t-serv"></p></div>',
                '<div><p>Origen</p><p id="cw-t-orig"></p></div>',
                '<div><p>Destino</p><p id="cw-t-dest"></p></div>',
                '<div><p>Retiro</p><p id="cw-t-retiro"></p></div>',
                '<div><p>Entrega estimada</p><p id="cw-t-entrega"></p></div>',
              '</div>',
              '<div class="cw-stitle">Historial</div>',
              '<div class="cw-timeline" id="cw-t-timeline"></div>',
            '</div>',
          '</div>',
        '</div>',

      '</div>'
    ].join("");

    // ── Tabs ──────────────────────────────────────────────────
    window.cwTab = function(panel, btn) {
      document.querySelectorAll(".cw-panel").forEach(function(p) { p.classList.remove("on"); });
      document.querySelectorAll(".cw-tab").forEach(function(b) { b.classList.remove("on"); });
      document.getElementById("cw-panel-" + panel).classList.add("on");
      btn.classList.add("on");
    };

    // ── Ciudades ──────────────────────────────────────────────
    window.cwCiudades = function(tipo) {
      var prov = document.getElementById("cw-prov-" + tipo).value;
      var sel  = document.getElementById("cw-ciudad-" + tipo);
      var cs   = PROVINCIAS[prov] || [];
      sel.disabled = !cs.length;
      sel.innerHTML = cs.length
        ? '<option value="">— Seleccioná ciudad —</option>' + cs.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join("")
        : '<option value="">— Seleccioná provincia —</option>';
    };

    // ── Volumen ───────────────────────────────────────────────
    window.cwVol = function() {
      var l = parseFloat(document.getElementById("cw-largo").value) || 0;
      var a = parseFloat(document.getElementById("cw-ancho").value) || 0;
      var h = parseFloat(document.getElementById("cw-alto").value)  || 0;
      var b = parseInt(document.getElementById("cw-bultos").value)  || 1;
      var info = document.getElementById("cw-vol-info");
      if (l > 0 && a > 0 && h > 0) {
        var vol = (l * a * h / 1000000) * b;
        document.getElementById("cw-vol-val").textContent  = vol.toFixed(4);
        document.getElementById("cw-pvol-val").textContent = (vol * 250).toFixed(1);
        info.style.display = "block";
      } else {
        info.style.display = "none";
      }
    };

    // ── Tipo doc particular/empresa ───────────────────────────
    window.cwTipoDoc = function(pre) {
      var tipo = document.getElementById("cw-" + pre + "-tipo").value;
      var esEmp = tipo === "empresa";
      document.getElementById("cw-" + pre + "-nom-lbl").textContent = esEmp ? "Razón social *" : "Nombre *";
      document.getElementById("cw-" + pre + "-doc-lbl").textContent = esEmp ? "CUIT *" : "DNI *";
      document.getElementById("cw-" + pre + "-nom").placeholder     = esEmp ? "Transportes SA" : "Juan";
      document.getElementById("cw-" + pre + "-doc").placeholder     = esEmp ? "30-12345678-9" : "28456789";
      document.getElementById("cw-" + pre + "-ap-row").style.display = esEmp ? "none" : "";
      if (esEmp) document.getElementById("cw-" + pre + "-ap").value = "";
    };

    // ── S/N toggle ────────────────────────────────────────────
    window.cwToggleSN = function(pre) {
      var input = document.getElementById("cw-" + pre + "-num");
      var btn   = document.getElementById("cw-" + pre + "-sn");
      if (input.value === "S/N") {
        input.value = ""; input.disabled = false;
        btn.classList.remove("on");
      } else {
        input.value = "S/N"; input.disabled = true;
        btn.classList.add("on");
      }
    };

    window.cwCheckSN = function(pre) {
      if (document.getElementById("cw-" + pre + "-num").value !== "S/N") {
        document.getElementById("cw-" + pre + "-sn").classList.remove("on");
      }
    };

    // ── Copiar código ─────────────────────────────────────────
    window.cwCopiar = function() {
      var cod = document.getElementById("cw-codigo").textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cod).then(function() { alert("Código copiado: " + cod); });
      }
    };

    // ── Leer campo ────────────────────────────────────────────
    function val(id) { return document.getElementById(id).value.trim(); }

    // ── Cotizar ───────────────────────────────────────────────
    document.getElementById("cw-btn").addEventListener("click", async function() {
      var errEl  = document.getElementById("cw-error");
      var resEl  = document.getElementById("cw-result");
      var loadEl = document.getElementById("cw-loading");
      errEl.style.display = "none"; resEl.style.display = "none";

      var provOrigen    = val("cw-prov-origen");
      var ciudadOrigen  = val("cw-ciudad-origen");
      var provDestino   = val("cw-prov-destino");
      var ciudadDestino = val("cw-ciudad-destino");
      var peso_kg       = parseFloat(document.getElementById("cw-peso").value) || 0;
      var largo         = parseFloat(document.getElementById("cw-largo").value) || 0;
      var ancho         = parseFloat(document.getElementById("cw-ancho").value) || 0;
      var alto          = parseFloat(document.getElementById("cw-alto").value)  || 0;
      var bultos        = parseInt(document.getElementById("cw-bultos").value)  || 1;
      var servicio      = val("cw-servicio");
      var modalidad     = val("cw-modalidad");
      var pago          = val("cw-pago");

      function err(msg) { errEl.textContent = msg; errEl.style.display = "block"; }

      if (!provOrigen || !ciudadOrigen)   { err("Seleccioná provincia y ciudad de origen."); return; }
      if (!provDestino || !ciudadDestino) { err("Seleccioná provincia y ciudad de destino."); return; }
      if (!peso_kg)                       { err("Ingresá el peso del envío."); return; }

      // Validar remitente
      var remTipo = val("cw-rem-tipo");
      var remNom  = val("cw-rem-nom");
      var remAp   = val("cw-rem-ap");
      var remDoc  = val("cw-rem-doc");
      var remCel  = val("cw-rem-cel");
      var remCalle= val("cw-rem-calle");
      var remNum  = val("cw-rem-num");
      var remCP   = val("cw-rem-cp");
      var remEntre= val("cw-rem-entre");
      if (!remNom || !remDoc || !remCel) { err("Completá nombre/razón social, DNI/CUIT y celular del remitente."); return; }
      if (remTipo === "particular" && !remAp) { err("Ingresá el apellido del remitente."); return; }
      if (!remCalle)  { err("Ingresá la calle del remitente."); return; }
      if (!remNum)    { err("Ingresá el número o marcá S/N (remitente)."); return; }
      if (!remCP)     { err("Ingresá el código postal del remitente."); return; }

      // Validar destinatario
      var destTipo  = val("cw-dest-tipo");
      var destNom   = val("cw-dest-nom");
      var destAp    = val("cw-dest-ap");
      var destDoc   = val("cw-dest-doc");
      var destCel   = val("cw-dest-cel");
      var destCalle = val("cw-dest-calle");
      var destNum   = val("cw-dest-num");
      var destCP    = val("cw-dest-cp");
      var destEntre = val("cw-dest-entre");
      if (!destNom || !destDoc || !destCel) { err("Completá nombre/razón social, DNI/CUIT y celular del destinatario."); return; }
      if (destTipo === "particular" && !destAp) { err("Ingresá el apellido del destinatario."); return; }
      if (!destCalle) { err("Ingresá la calle del destinatario."); return; }
      if (!destNum)   { err("Ingresá el número o marcá S/N (destinatario)."); return; }
      if (!destCP)    { err("Ingresá el código postal del destinatario."); return; }

      var origen   = ciudadOrigen + " (" + provOrigen + ")";
      var destino  = ciudadDestino + " (" + provDestino + ")";
      var volumen_m3 = largo > 0 && ancho > 0 && alto > 0 ? (largo * ancho * alto / 1000000) * bultos : 0;

      this.disabled = true; loadEl.style.display = "block";
      try {
        var res  = await fetch(API_BASE + "/api/widget/" + empresa + "/cotizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origen: origen, destino: destino, peso_kg: peso_kg, volumen_m3: volumen_m3, tipo_servicio: servicio })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cotizar");

        var sinIVA = data.precio_total;
        var iva    = sinIVA * 0.21;
        var conIVA = sinIVA * 1.21;

        var mLabels = { deposito_sucursal: "Depósito → Sucursal", deposito_domicilio: "Depósito → Domicilio", domicilio_domicilio: "Domicilio → Domicilio" };
        var pLabels = { origen: "Pago en origen", destino: "Pago en destino" };
        var sLabels = { estandar: "Estándar", express: "Express 48h", consolidado: "Consolidado" };

        var remLabel  = remTipo === "empresa" ? remNom : remAp + ", " + remNom;
        var destLabel = destTipo === "empresa" ? destNom : destAp + ", " + destNom;
        var dirRem    = remCalle + " " + remNum + (remEntre ? ", entre " + remEntre : "") + " (CP " + remCP + ")";
        var dirDest   = destCalle + " " + destNum + (destEntre ? ", entre " + destEntre : "") + " (CP " + destCP + ")";

        document.getElementById("cw-precio").textContent    = fmt(conIVA);
        document.getElementById("cw-plazo").textContent     = "⏱ " + data.plazo;
        document.getElementById("cw-r-siniva").textContent  = fmt(sinIVA);
        document.getElementById("cw-r-iva").textContent     = fmt(iva);
        document.getElementById("cw-r-peso").textContent    = data.peso_efectivo_kg + " kg";
        document.getElementById("cw-r-modal").textContent   = mLabels[modalidad];
        document.getElementById("cw-r-pago").textContent    = pLabels[pago];
        document.getElementById("cw-r-rem").textContent     = remLabel;
        document.getElementById("cw-r-dir-rem").textContent = dirRem;
        document.getElementById("cw-r-dest").textContent    = destLabel;
        document.getElementById("cw-r-dir-dest").textContent= dirDest;
        document.getElementById("cw-r-total").textContent   = fmt(conIVA);
        document.getElementById("cw-codigo").textContent    = generarCodigo();
        resEl.style.display = "block";
      } catch(e) {
        err(e.message);
      } finally {
        this.disabled = false; loadEl.style.display = "none";
      }
    });

    // ── Rastrear ──────────────────────────────────────────────
    window.cwRastrear = async function() {
      var num   = document.getElementById("cw-track-input").value.trim().toUpperCase();
      var errEl = document.getElementById("cw-track-error");
      var resEl = document.getElementById("cw-track-result");
      errEl.style.display = "none"; resEl.style.display = "none";
      if (!num) { errEl.textContent = "Ingresá el número de seguimiento."; errEl.style.display = "block"; return; }
      try {
        var r = await fetch(API_BASE + "/api/tracking/" + num);
        var d = await r.json();
        if (!r.ok) throw new Error(d.error || "No encontrado");

        var e   = d.envio;
        var col = ESTADO_COLORS[e.estado] || "#6b7280";
        var lbl = ESTADO_LABELS[e.estado] || e.estado;
        var sLabels = { estandar: "Estándar", express: "Express 48h", consolidado: "Consolidado" };
        function fmtF(iso) { return iso ? new Date(iso).toLocaleDateString("es-AR") : "—"; }

        document.getElementById("cw-t-estado").textContent = lbl;
        document.getElementById("cw-t-estado").style.background = col + "22";
        document.getElementById("cw-t-estado").style.color = col;
        document.getElementById("cw-t-num").textContent     = e.numero_seguimiento;
        document.getElementById("cw-t-serv").textContent    = sLabels[e.tipo_servicio] || e.tipo_servicio;
        document.getElementById("cw-t-orig").textContent    = e.origen;
        document.getElementById("cw-t-dest").textContent    = e.destino;
        document.getElementById("cw-t-retiro").textContent  = fmtF(e.fecha_retiro);
        document.getElementById("cw-t-entrega").textContent = fmtF(e.fecha_entrega_estimada);

        document.getElementById("cw-t-timeline").innerHTML = d.eventos.slice().reverse().map(function(ev) {
          return '<div class="cw-ev"><p>' + (ESTADO_LABELS[ev.estado] || ev.estado) + (ev.descripcion ? " — " + ev.descripcion : "") + '</p>' +
            '<small>' + (ev.ubicacion ? "📍 " + ev.ubicacion + " · " : "") + new Date(ev.fecha).toLocaleString("es-AR") + '</small></div>';
        }).join("") || '<p style="font-size:13px;color:#6b7280">Sin eventos registrados</p>';

        resEl.style.display = "block";
      } catch(e) {
        errEl.textContent = e.message; errEl.style.display = "block";
      }
    };

    document.getElementById("cw-track-input").addEventListener("keydown", function(e) {
      if (e.key === "Enter") cwRastrear();
    });
  }

  fetch(API_BASE + "/api/widget/" + empresa + "/config")
    .then(function(r) { return r.json(); })
    .then(buildHTML)
    .catch(function() {
      var el = document.getElementById(containerId);
      if (el) el.innerHTML = '<p style="color:red;font-size:13px">Error al cargar el cotizador.</p>';
    });
})();