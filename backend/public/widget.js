// Cargar jsPDF
(function() {
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  document.head.appendChild(s);
})();
(function () {
  var scriptTag   = document.currentScript;
  var empresa     = scriptTag.getAttribute('data-empresa') || 'transporte-joaquin';
  var API_BASE    = scriptTag.getAttribute('data-api') || window.location.origin;
  var containerId = scriptTag.getAttribute('data-container') || 'cotizador-widget';

  // Evitar que la rueda del mouse cambie los inputs numéricos del widget
  document.addEventListener('wheel', function(e) {
    var el = document.activeElement;
    if (el && el.type === 'number' && el.closest('#' + containerId)) {
      el.blur();
    }
  }, { passive: true });


  var ESTADO_LABELS = {confirmado:"Confirmado",en_transito:"En tránsito",en_centro:"En centro de distribución",en_camino:"En camino al destino",entregado:"Entregado",cancelado:"Cancelado",pendiente_pago:"Pendiente de pago",pendiente_retiro:"Pendiente de retiro",pendiente_entrega_deposito:"Pendiente de entrega en depósito",en_deposito_origen:"En depósito de origen"};
    var ESTADO_COLORS = {confirmado:"#3b82f6",en_transito:"#8b5cf6",en_centro:"#06b6d4",en_camino:"#f97316",entregado:"#16a34a",cancelado:"#dc2626",pendiente_pago:"#f59e0b",pendiente_retiro:"#f59e0b",pendiente_entrega_deposito:"#f59e0b",en_deposito_origen:"#06b6d4"};

  function injectStyles(c1, c2) {
    if (document.getElementById('cw-styles')) return;
    var s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = `
      #cw-root *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
      #cw-root{width:100%;max-width:600px}
      .cw-tabs{display:flex;border:1.5px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px}
      .cw-tab{flex:1;padding:10px;font-size:14px;font-weight:600;background:#f9fafb;border:none;cursor:pointer;color:#6b7280;font-family:inherit;transition:all .15s}
      .cw-tab.on{background:${c1};color:#fff}
      .cw-panel{display:none}.cw-panel.on{display:block}
      .cw-steps{display:flex;align-items:center;margin-bottom:22px}
      .cw-sw{display:flex;flex-direction:column;align-items:center}
      .cw-sd{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;border:2px solid #e5e7eb;background:#fff;color:#9ca3af;transition:all .3s}
      .cw-sd.on{background:${c1};border-color:${c1};color:#fff}
      .cw-sd.done{background:${c2};border-color:${c2};color:#fff}
      .cw-sl{font-size:10px;color:#9ca3af;margin-top:4px;white-space:nowrap}
      .cw-line{flex:1;height:2px;background:#e5e7eb;transition:background .3s}
      .cw-line.done{background:${c2}}
      .cw-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:22px;margin-bottom:14px}
      .cw-ctitle{font-size:16px;font-weight:700;color:${c2};margin-bottom:4px}
      .cw-csub{font-size:13px;color:#6b7280;margin-bottom:18px}
      .cw-row{margin-bottom:14px}
      .cw-row label{display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px}
      .cw-row select,.cw-row input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#111;outline:none;transition:border-color .2s;background:#fff;font-family:inherit}
      .cw-row select:focus,.cw-row input:focus{border-color:${c1}}
      .cw-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cw-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
      .cw-tipo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
      .cw-tipo-btn{border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;cursor:pointer;background:#fff;text-align:left;transition:all .15s;font-family:inherit}
      .cw-tipo-btn:hover{border-color:${c1}}
      .cw-tipo-btn.on{border-color:${c1};border-width:2px;background:#fff5f2}
      .cw-tipo-btn .tbi{font-size:24px;display:block;margin-bottom:6px}
      .cw-tipo-btn .tbl{font-size:13px;font-weight:700;color:${c2};display:block}
      .cw-tipo-btn .tbs{font-size:11px;color:#6b7280;display:block;margin-top:2px}
      .cw-modal-list{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
      .cw-modal-item{border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 16px;cursor:pointer;background:#fff;text-align:left;display:flex;align-items:center;gap:12px;font-family:inherit;transition:all .15s}
      .cw-modal-item:hover{border-color:${c1}}
      .cw-modal-item.on{border-color:${c1};border-width:2px;background:#fff5f2}
      .cw-modal-ico{font-size:22px;flex-shrink:0}
      .cw-modal-txt strong{display:block;font-size:13px;font-weight:700;color:${c2}}
      .cw-modal-txt span{font-size:12px;color:#6b7280}
      .cw-radio{margin-left:auto;width:18px;height:18px;border-radius:50%;border:2px solid #e5e7eb;flex-shrink:0;transition:all .2s}
      .cw-modal-item.on .cw-radio{border-color:${c1};background:${c1};box-shadow:inset 0 0 0 3px #fff5f2}
      .cw-vol-info{background:#f9fafb;border-radius:7px;padding:8px 12px;font-size:12px;color:#6b7280;margin-top:8px;display:none}
      .cw-vol-info span{font-weight:700;color:${c1}}
      .cw-sn-wrap{display:flex;gap:8px}
      .cw-sn-wrap input{flex:1}
      .cw-sn-btn{padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;background:#f9fafb;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#6b7280;white-space:nowrap;transition:all .15s}
      .cw-sn-btn.on{background:${c1};color:#fff;border-color:${c1}}
      .cw-nav{display:flex;justify-content:space-between;gap:12px;margin-top:4px}
      .cw-btn-back{background:#f3f4f6;border:none;color:#374151;padding:11px 20px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:600}
      .cw-btn-next{background:${c1};border:none;color:#fff;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;margin-left:auto}
      .cw-btn-next:disabled{opacity:.55;cursor:not-allowed}
      .cw-result{background:${c2};border-radius:12px;padding:24px;color:#fff}
      .cw-rprice{font-size:48px;font-weight:800;line-height:1}
      .cw-runit{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:14px}
      .cw-rbadge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;margin-bottom:18px}
      .cw-rrows{border-top:1px solid rgba(255,255,255,.15);padding-top:14px;display:flex;flex-direction:column;gap:6px}
      .cw-rrow{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.65);gap:8px}
      .cw-rrow span:last-child{text-align:right;max-width:55%}
      .cw-rrow.total{color:#fff;font-weight:700;font-size:15px;border-top:1px solid rgba(255,255,255,.2);margin-top:6px;padding-top:10px}
      .cw-pay-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
      .cw-pay-btn{border:none;border-radius:8px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .15s}
      .cw-pay-btn:hover{opacity:.85}
      .cw-pay-btn:disabled{opacity:.5;cursor:not-allowed}
      .cw-pay-primary{background:${c1};color:#fff}
      .cw-pay-secondary{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25)!important}
      .cw-qr-box{display:none;text-align:center;margin-top:14px;background:rgba(255,255,255,.08);border-radius:10px;padding:16px}
      .cw-qr-box p{font-size:12px;color:rgba(255,255,255,.6);margin-bottom:10px}
      .cw-qr-box img{width:170px;height:170px;border-radius:8px;background:#fff;padding:8px}
      .cw-qr-box small{display:block;font-size:11px;color:rgba(255,255,255,.4);margin-top:8px}
      .cw-codigo-box{margin-top:14px;background:rgba(255,255,255,.08);border-radius:8px;padding:14px;text-align:center}
      .cw-codigo-box p{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:6px}
      .cw-codigo{font-size:20px;font-weight:800;letter-spacing:3px}
      .cw-copy-btn{background:rgba(255,255,255,.12);border:none;color:#fff;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;margin-top:6px;font-family:inherit}
      .cw-pago-loading{font-size:12px;color:rgba(255,255,255,.6);margin-top:8px;text-align:center;display:none}
      .cw-err{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-top:10px;display:none}
      .cw-track-wrap{display:flex;gap:8px;margin-bottom:14px}
      .cw-track-wrap input{flex:1;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;text-transform:uppercase;font-family:inherit}
      .cw-track-wrap input:focus{border-color:${c1}}
      .cw-track-btn{background:${c1};color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
      .cw-track-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px}
      .cw-track-estado{display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:14px}
      .cw-tinfo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
      .cw-tinfo div p:first-child{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;font-weight:600}
      .cw-tinfo div p:last-child{font-size:14px;font-weight:600;color:#111;margin-top:2px}
      .cw-timeline{border-left:2px solid #e5e7eb;padding-left:16px}
      .cw-tev{position:relative;margin-bottom:14px}
      .cw-tev::before{content:'';position:absolute;left:-21px;top:4px;width:10px;height:10px;border-radius:50%;background:${c1};border:2px solid #fff;box-shadow:0 0 0 2px ${c1}}
      .cw-tev p{font-size:13px;font-weight:600;color:#111}
      .cw-tev small{font-size:12px;color:#6b7280}
      .cw-track-err{color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;display:none;margin-top:10px}
      @media(max-width:480px){.cw-g2{grid-template-columns:1fr}.cw-g3{grid-template-columns:1fr}.cw-pay-btns{grid-template-columns:1fr}.cw-tipo-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  var _cwOrigenes = [];
  var _cwTarifas = [];

  function buildOrigenOptions() {
    return _cwOrigenes.map(function(o){ return '<option value="'+o+'">'+o+'</option>'; }).join('');
  }

  function buildDestinoOptions(origenSeleccionado) {
    var destinos = _cwTarifas
      .filter(function(t){ return t.origen === origenSeleccionado; })
      .map(function(t){ return t.destino; });
    return destinos.map(function(d){ return '<option value="'+d+'">'+d+'</option>'; }).join('');
  }

  function personaFields(pre, titulo, subtitulo) {
    return [
      '<div class="cw-card">',
        '<div class="cw-ctitle">'+titulo+'</div>',
        '<div class="cw-csub">'+subtitulo+'</div>',
        '<div class="cw-tipo-grid">',
          '<button type="button" class="cw-tipo-btn on" onclick="cwTipo(\''+pre+'\',\'particular\',this)">',
            '<span class="tbi">👤</span>',
            '<span class="tbl">Particular</span>',
            '<span class="tbs">Persona física</span>',
          '</button>',
          '<button type="button" class="cw-tipo-btn" onclick="cwTipo(\''+pre+'\',\'empresa\',this)">',
            '<span class="tbi">🏢</span>',
            '<span class="tbl">Empresa</span>',
            '<span class="tbs">Persona jurídica</span>',
          '</button>',
        '</div>',
        '<div class="cw-g2" id="cw-'+pre+'-nom-row">',
          '<div class="cw-row"><label id="cw-'+pre+'-nom-lbl">Nombre *</label><input id="cw-'+pre+'-nom" placeholder="Juan"></div>',
          '<div class="cw-row" id="cw-'+pre+'-ap-row"><label>Apellido *</label><input id="cw-'+pre+'-ap" placeholder="Pérez"></div>',
        '</div>',
        '<div class="cw-g2">',
          '<div class="cw-row"><label id="cw-'+pre+'-doc-lbl">DNI *</label><input id="cw-'+pre+'-doc" placeholder="28456789"></div>',
          '<div class="cw-row"><label>Celular *</label><input id="cw-'+pre+'-cel" type="tel" placeholder="11-1234-5678"></div>',
        '</div>',
        '<div class="cw-row"><label>Email</label><input id="cw-'+pre+'-email" type="email" placeholder="mail@ejemplo.com"></div>',
        '<div class="cw-g2">',
          '<div class="cw-row"><label>Calle *</label><input id="cw-'+pre+'-calle" placeholder="Av. San Martín"></div>',
          '<div class="cw-row"><label>Número *</label>',
            '<div class="cw-sn-wrap">',
              '<input id="cw-'+pre+'-num" placeholder="1234" oninput="cwCheckSN(\''+pre+'\')">',
              '<button type="button" class="cw-sn-btn" id="cw-'+pre+'-sn" onclick="cwToggleSN(\''+pre+'\')">S/N</button>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="cw-g2">',
          '<div class="cw-row"><label>Entre calles (opcional)</label><input id="cw-'+pre+'-entre" placeholder="Corrientes y Callao"></div>',
          '<div class="cw-row"><label>Código postal *</label><input id="cw-'+pre+'-cp" placeholder="1406"></div>',
        '</div>',
      '</div>'
    ].join('');
  }

  function buildHTML(config) {
    window._cwConfig = config;
    var emp = config.empresa;
    var c1  = emp.color_primario  || '#E8500A';
    var c2  = emp.color_secundario || '#0B1E3D';
    injectStyles(c1, c2);

    _cwOrigenes = config.origenes || [];
    _cwTarifas = config.tarifas || [];
    var po = buildOrigenOptions();
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = [
      '<div id="cw-root">',

        '<div class="cw-tabs">',
          '<button class="cw-tab on" onclick="cwTab(\'cotizar\',this)">📦 Cotizar envío</button>',
          '<button class="cw-tab" onclick="cwTab(\'tracking\',this)">🔍 Rastrear envío</button>',
        '</div>',

        // ── PANEL COTIZAR ──
        '<div class="cw-panel on" id="cw-panel-cotizar">',

          // Steps bar
          '<div class="cw-steps" id="cw-steps">',
            '<div class="cw-sw"><div class="cw-sd on" id="cw-sd1">1</div><div class="cw-sl">Ruta</div></div>',
            '<div class="cw-line" id="cw-sl1"></div>',
            '<div class="cw-sw"><div class="cw-sd" id="cw-sd2">2</div><div class="cw-sl">Paquete</div></div>',
            '<div class="cw-line" id="cw-sl2"></div>',
            '<div class="cw-sw"><div class="cw-sd" id="cw-sd3">3</div><div class="cw-sl">Remitente</div></div>',
            '<div class="cw-line" id="cw-sl3"></div>',
            '<div class="cw-sw"><div class="cw-sd" id="cw-sd4">4</div><div class="cw-sl">Destinatario</div></div>',
            '<div class="cw-line" id="cw-sl4"></div>',
            '<div class="cw-sw"><div class="cw-sd" id="cw-sd5">5</div><div class="cw-sl">Pago</div></div>',
          '</div>',

          // PASO 1: RUTA
          '<div id="cw-paso1">',
            '<div class="cw-card">',
              '<div class="cw-ctitle">📍 ¿De dónde a dónde?</div>',
              '<div class="cw-csub">Seleccioná el origen y destino del envío</div>',
              '<div class="cw-g2">',
                '<div class="cw-row"><label>Origen</label><select id="cw-origen" onchange="cwFiltrarDestinos()"><option value="">— Seleccioná origen —</option>'+po+'</select></div>',
                '<div class="cw-row"><label>Destino</label><select id="cw-destino" disabled><option value="">— Primero elegí origen —</option></select></div>',
              '</div>',
              '<div class="cw-row"><label>Modalidad de envío</label>',
                '<div class="cw-modal-list">',
                  '<button type="button" class="cw-modal-item on" onclick="cwModal(this,\'deposito_sucursal\')"><span class="cw-modal-ico">🏭</span><div class="cw-modal-txt"><strong>Entrega en depósito → Retiro en sucursal</strong><span>Dejás en nuestro depósito, retiran en sucursal</span></div><div class="cw-radio"></div></button>',
                  '<button type="button" class="cw-modal-item" onclick="cwModal(this,\'deposito_domicilio\')"><span class="cw-modal-ico">🏠</span><div class="cw-modal-txt"><strong>Entrega en depósito → Entrega a domicilio</strong><span>Dejás en depósito, entregamos en casa</span></div><div class="cw-radio"></div></button>',
                  '<button type="button" class="cw-modal-item" onclick="cwModal(this,\'domicilio_domicilio\')"><span class="cw-modal-ico">🚛</span><div class="cw-modal-txt"><strong>Retiro a domicilio → Entrega a domicilio</strong><span>Retiramos y entregamos en domicilio</span></div><div class="cw-radio"></div></button>',
                '</div>',
              '</div>',
            '</div>',
            '<div class="cw-nav"><button class="cw-btn-next" onclick="cwGoTo(2)">Siguiente ›</button></div>',
          '</div>',

          // PASO 2: PAQUETE
          '<div id="cw-paso2" style="display:none">',
            '<div class="cw-card">',
              '<div class="cw-ctitle">⚖️ ¿Qué vas a enviar?</div>',
              '<div class="cw-csub">Peso, medidas y tipo de servicio</div>',
              '<div class="cw-g2">',
                '<div class="cw-row"><label>Peso (kg) *</label><input type="number" id="cw-peso" placeholder="0" min="0.1" step="0.1" oninput="cwVol()"></div>',
                '<div class="cw-row"><label>Cantidad de bultos</label><input type="number" id="cw-bultos" placeholder="1" min="1" value="1" oninput="cwVol()"></div>',
              '</div>',
              '<div class="cw-row"><label>Dimensiones por bulto en cm (opcional)</label>',
                '<div class="cw-g3"><input type="number" id="cw-largo" placeholder="Largo cm" min="0" oninput="cwVol()"><input type="number" id="cw-ancho" placeholder="Ancho cm" min="0" oninput="cwVol()"><input type="number" id="cw-alto" placeholder="Alto cm" min="0" oninput="cwVol()"></div>',
                '<div class="cw-vol-info" id="cw-vol-info">Volumen: <span id="cw-vol-val">—</span> m³ · Peso volumétrico: <span id="cw-pvol-val">—</span> kg</div>',
                '<div id="cw-limite-aviso" style="display:none;margin-top:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:8px 12px;font-size:12px;font-weight:600;color:#dc2626">⚠️ Este envío supera los límites de carga. Contactá a la empresa.</div>',
              '</div>',
              '<div class="cw-row"><label>Tipo de servicio</label>',
                '<select id="cw-servicio">',
                  '<option value="estandar">Estándar — 3 a 5 días hábiles</option>',
                  '<option value="express">Express 48hs — urgente (+35%)</option>',
                  '<option value="consolidado">Consolidado — económico (–15%)</option>',
                '</select>',
              '</div>',
              '<div class="cw-row"><label>Forma de pago</label>',
                '<select id="cw-pago">',
                  '<option value="origen">Pago en origen (quien envía)</option>',
                  '<option value="destino">Pago en destino (quien recibe)</option>',
                  '<option value="sucursal">Pagar en sucursal (efectivo o transferencia)</option>',
                '</select>',
              '</div>',
            '</div>',
            '<div class="cw-nav"><button class="cw-btn-back" onclick="cwGoTo(1)">‹ Atrás</button><button class="cw-btn-next" onclick="cwGoTo(3)">Siguiente ›</button></div>',
          '</div>',

          // PASO 3: REMITENTE
          '<div id="cw-paso3" style="display:none">',
            personaFields('rem','👤 Datos del remitente','Quien envía el paquete'),
            '<div class="cw-nav"><button class="cw-btn-back" onclick="cwGoTo(2)">‹ Atrás</button><button class="cw-btn-next" onclick="cwGoTo(4)">Siguiente ›</button></div>',
          '</div>',

          // PASO 4: DESTINATARIO
          '<div id="cw-paso4" style="display:none">',
            personaFields('dest','📬 Datos del destinatario','Quien recibe el paquete'),
            '<div class="cw-nav"><button class="cw-btn-back" onclick="cwGoTo(3)">‹ Atrás</button><button class="cw-btn-next" onclick="cwCotizar()">Ver precio 💰</button></div>',
          '</div>',

          // PASO 5: RESULTADO
          '<div id="cw-paso5" style="display:none">',
            '<div id="cw-result-box"></div>',
            '<div class="cw-nav" style="margin-top:12px"><button class="cw-btn-back" onclick="cwGoTo(4)">‹ Modificar</button></div>',
          '</div>',

          '<div class="cw-err" id="cw-err"></div>',
        '</div>',

        // ── PANEL TRACKING ──
        '<div class="cw-panel" id="cw-panel-tracking">',
          '<p style="font-size:14px;color:#6b7280;margin-bottom:14px">Ingresá tu código para ver el estado de tu envío.</p>',
          '<div class="cw-track-wrap">',
            '<input type="text" id="cw-track-input" placeholder="Ej: TJ-2026-123456" maxlength="20">',
            '<button class="cw-track-btn" onclick="cwRastrear()">Rastrear</button>',
          '</div>',
          '<div class="cw-track-err" id="cw-track-err"></div>',
          '<div id="cw-track-result" style="display:none">',
            '<div class="cw-track-card">',
              '<span class="cw-track-estado" id="cw-t-estado"></span>',
              '<div class="cw-tinfo">',
                '<div><p>Número</p><p id="cw-t-num"></p></div>',
                '<div><p>Servicio</p><p id="cw-t-serv"></p></div>',
                '<div><p>Origen</p><p id="cw-t-orig"></p></div>',
                '<div><p>Destino</p><p id="cw-t-dest"></p></div>',
              '</div>',
              '<div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px">Historial</div>',
              '<div class="cw-timeline" id="cw-t-timeline"></div>',
            '</div>',
          '</div>',
        '</div>',

      '</div>'
    ].join('');

    // ── Opción "Pago en destino" según el recargo configurado por la empresa
    (function() {
      var tipo = emp.recargo_destino_tipo || 'ninguno';
      var valor = parseFloat(emp.recargo_destino_valor) || 0;
      var opt = document.querySelector('#cw-pago option[value="destino"]');
      if (!opt) return;
      if (tipo === 'ninguno') opt.remove();
      else if (tipo === 'porcentaje') opt.textContent = 'Pago en destino (+' + valor + '%)';
      else if (tipo === 'monto') opt.textContent = 'Pago en destino (+$' + Math.round(valor).toLocaleString('es-AR') + ')';
    })();

    // Restaurar estado guardado si volvió atrás
    var _saved = JSON.parse(sessionStorage.getItem('cw_estado') || '{}');
    var currentPaso = 1;
    var modalidad   = _saved.modalidad || 'deposito_sucursal';
    var tipoRem     = _saved.tipoRem   || 'particular';
    var tipoDest    = _saved.tipoDest  || 'particular';

    // ── Tabs
    window.cwTab = function(panel, btn) {
      document.querySelectorAll('.cw-panel').forEach(function(p){p.classList.remove('on');});
      document.querySelectorAll('.cw-tab').forEach(function(b){b.classList.remove('on');});
      document.getElementById('cw-panel-'+panel).classList.add('on');
      btn.classList.add('on');
    };

    // ── Wizard navigation
    window.cwGoTo = function(n) {
      // Guardar estado antes de avanzar
      sessionStorage.setItem('cw_estado', JSON.stringify({
        modalidad: modalidad,
        tipoRem: tipoRem,
        tipoDest: tipoDest,
        paso: n,
        campos: {
          origen: document.getElementById('cw-origen')?.value,
          destino: document.getElementById('cw-destino')?.value,
          peso: document.getElementById('cw-peso')?.value,
          bultos: document.getElementById('cw-bultos')?.value,
          largo: document.getElementById('cw-largo')?.value,
          ancho: document.getElementById('cw-ancho')?.value,
          alto: document.getElementById('cw-alto')?.value,
          servicio: document.getElementById('cw-servicio')?.value,
          pago: document.getElementById('cw-pago')?.value,
          remNom: document.getElementById('cw-rem-nom')?.value,
          remAp: document.getElementById('cw-rem-ap')?.value,
          remDoc: document.getElementById('cw-rem-doc')?.value,
          remCel: document.getElementById('cw-rem-cel')?.value,
          remEmail: document.getElementById('cw-rem-email')?.value,
          remCalle: document.getElementById('cw-rem-calle')?.value,
          remNum: document.getElementById('cw-rem-num')?.value,
          remCP: document.getElementById('cw-rem-cp')?.value,
          destNom: document.getElementById('cw-dest-nom')?.value,
          destAp: document.getElementById('cw-dest-ap')?.value,
          destDoc: document.getElementById('cw-dest-doc')?.value,
          destCel: document.getElementById('cw-dest-cel')?.value,
          destEmail: document.getElementById('cw-dest-email')?.value,
          destCalle: document.getElementById('cw-dest-calle')?.value,
          destNum: document.getElementById('cw-dest-num')?.value,
          destCP: document.getElementById('cw-dest-cp')?.value,
        }
      }));
      document.getElementById('cw-paso'+currentPaso).style.display = 'none';
      document.getElementById('cw-err').style.display = 'none';
      currentPaso = n;
      document.getElementById('cw-paso'+n).style.display = 'block';
      updateSteps();
      var root = document.getElementById('cw-root');
      if (root) root.scrollIntoView({behavior:'smooth', block:'start'});
    };

    function updateSteps() {
      for (var i=1;i<=5;i++) {
        var dot = document.getElementById('cw-sd'+i);
        dot.classList.remove('on','done');
        if (i < currentPaso) { dot.classList.add('done'); dot.textContent='✓'; }
        else if (i === currentPaso) { dot.classList.add('on'); dot.textContent=i; }
        else { dot.textContent=i; }
        if (i<5) {
          var line = document.getElementById('cw-sl'+i);
          line.classList.toggle('done', i < currentPaso);
        }
      }
    }

    // ── Filtrar destinos según origen
    window.cwFiltrarDestinos = function() {
      var origen = document.getElementById('cw-origen').value;
      var sel = document.getElementById('cw-destino');
      var opts = buildDestinoOptions(origen);
      sel.disabled = !opts;
      sel.innerHTML = opts
        ? '<option value="">— Seleccioná destino —</option>' + opts
        : '<option>— No hay destinos disponibles —</option>';
    };

    // ── Modalidad
    window.cwModal = function(btn, val) {
      document.querySelectorAll('.cw-modal-item').forEach(function(b){b.classList.remove('on');});
      btn.classList.add('on');
      modalidad = val;
    };

    // ── Volumen
    window.cwVol = function() {
      var l=parseFloat(document.getElementById('cw-largo').value)||0;
      var a=parseFloat(document.getElementById('cw-ancho').value)||0;
      var h=parseFloat(document.getElementById('cw-alto').value)||0;
      var b=parseInt(document.getElementById('cw-bultos').value)||1;
      var info=document.getElementById('cw-vol-info');
      if(l>0&&a>0&&h>0){
        var vol=(l*a*h/1000000)*b;
        document.getElementById('cw-vol-val').textContent=vol.toFixed(4);
        document.getElementById('cw-pvol-val').textContent=(vol*250).toFixed(1);
        info.style.display='block';
      } else { info.style.display='none'; }

      // Validar contra los límites de la empresa (null = sin límite)
      var emp=(window._cwConfig&&window._cwConfig.empresa)||{};
      var lim=function(k){ var x=parseFloat(emp[k]); return x>0?x:null; };
      var supera=function(valor,k){ var max=lim(k); return max!==null&&valor>max; };
      var peso=parseFloat(document.getElementById('cw-peso').value)||0;
      var excede=supera(peso,'limite_peso_kg')||supera(l,'limite_largo_cm')||
        supera(a,'limite_ancho_cm')||supera(h,'limite_alto_cm')||
        (l>0&&a>0&&h>0&&supera(vol,'limite_volumen_m3'));
      document.getElementById('cw-limite-aviso').style.display=excede?'block':'none';
      var btnNext=document.querySelector('#cw-paso2 .cw-btn-next');
      btnNext.disabled=excede;
      btnNext.style.opacity=excede?'.5':'';
      btnNext.style.cursor=excede?'not-allowed':'';
    };

    // ── Tipo persona
    window.cwTipo = function(pre, tipo, btn) {
      btn.parentNode.querySelectorAll('.cw-tipo-btn').forEach(function(b){b.classList.remove('on');});
      btn.classList.add('on');
      if(pre==='rem') tipoRem=tipo; else tipoDest=tipo;
      var esEmp = tipo==='empresa';
      document.getElementById('cw-'+pre+'-nom-lbl').textContent = esEmp?'Razón social *':'Nombre *';
      document.getElementById('cw-'+pre+'-doc-lbl').textContent = esEmp?'CUIT *':'DNI *';
      document.getElementById('cw-'+pre+'-nom').placeholder     = esEmp?'Transportes SA':'Juan';
      document.getElementById('cw-'+pre+'-doc').placeholder     = esEmp?'30-12345678-9':'28456789';
      var apRow = document.getElementById('cw-'+pre+'-ap-row');
      apRow.style.display = esEmp?'none':'';
      if(esEmp) document.getElementById('cw-'+pre+'-ap').value='';
    };

    // ── S/N
    window.cwToggleSN = function(pre) {
      var inp=document.getElementById('cw-'+pre+'-num');
      var btn=document.getElementById('cw-'+pre+'-sn');
      if(inp.value==='S/N'){ inp.value=''; inp.disabled=false; btn.classList.remove('on'); }
      else { inp.value='S/N'; inp.disabled=true; btn.classList.add('on'); }
    };
    window.cwCheckSN = function(pre) {
      if(document.getElementById('cw-'+pre+'-num').value!=='S/N') document.getElementById('cw-'+pre+'-sn').classList.remove('on');
    };

    // ── Leer campo
    function v(id){ return document.getElementById(id).value.trim(); }

    function showErr(msg) {
      var el=document.getElementById('cw-err');
      el.textContent=msg; el.style.display='block';
    }

    // ── Cotizar
    window.cwCotizar = async function() {
      document.getElementById('cw-err').style.display='none';

      var provOrigen  = '';
      var ciudOrigen  = v('cw-origen');
      var provDestino = '';
      var ciudDestino = v('cw-destino');
      var peso        = parseFloat(document.getElementById('cw-peso').value)||0;
      var remNom=v('cw-rem-nom'), remAp=v('cw-rem-ap'), remDoc=v('cw-rem-doc'), remCel=v('cw-rem-cel');
      var remCalle=v('cw-rem-calle'), remNum=v('cw-rem-num'), remCP=v('cw-rem-cp'), remEntre=v('cw-rem-entre');
      var destNom=v('cw-dest-nom'), destAp=v('cw-dest-ap'), destDoc=v('cw-dest-doc'), destCel=v('cw-dest-cel');
      var destCalle=v('cw-dest-calle'), destNum=v('cw-dest-num'), destCP=v('cw-dest-cp'), destEntre=v('cw-dest-entre');

      if(!ciudOrigen){ showErr('Seleccioná el origen del envío.'); cwGoTo(1); return; }
      if(!ciudDestino){ showErr('Seleccioná el destino del envío.'); cwGoTo(1); return; }
      if(!peso){ showErr('Ingresá el peso del envío.'); cwGoTo(2); return; }
      if(!remNom||!remDoc||!remCel){ showErr('Completá nombre, DNI/CUIT y celular del remitente.'); cwGoTo(3); return; }
      if(tipoRem==='particular'&&!remAp){ showErr('Ingresá el apellido del remitente.'); cwGoTo(3); return; }
      if(!remCalle||!remNum||!remCP){ showErr('Completá la dirección del remitente (calle, número y CP).'); cwGoTo(3); return; }
      if(!destNom||!destDoc||!destCel){ showErr('Completá nombre, DNI/CUIT y celular del destinatario.'); cwGoTo(4); return; }
      if(tipoDest==='particular'&&!destAp){ showErr('Ingresá el apellido del destinatario.'); cwGoTo(4); return; }
      if(!destCalle||!destNum||!destCP){ showErr('Completá la dirección del destinatario (calle, número y CP).'); cwGoTo(4); return; }

      var largo=parseFloat(document.getElementById('cw-largo').value)||0;
      var ancho=parseFloat(document.getElementById('cw-ancho').value)||0;
      var alto =parseFloat(document.getElementById('cw-alto').value)||0;
      var bultos=parseInt(document.getElementById('cw-bultos').value)||1;
      var volM3=largo>0&&ancho>0&&alto>0?(largo*ancho*alto/1000000)*bultos:0;
      var servicio=v('cw-servicio');
      var pago=v('cw-pago');
      var origen=ciudOrigen;
      var destino=ciudDestino;

      // Llamar a la API
      var btnNext = document.querySelector('#cw-paso4 .cw-btn-next');
      btnNext.disabled=true; btnNext.textContent='Calculando...';

      try {
        var r = await fetch(API_BASE+'/api/widget/'+empresa+'/cotizar',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({origen:origen,destino:destino,peso_kg:peso,volumen_m3:volM3,tipo_servicio:servicio})
        });
        var data = await r.json();
        if(!r.ok) throw new Error(data.error||'No hay tarifa para esa ruta');

        // Recargo por pago en destino (se suma al flete, antes del IVA)
        var flete=data.precio_total;
        var recargo=0, recargoLabel='';
        var empCfg=(window._cwConfig&&window._cwConfig.empresa)||{};
        var recTipo=empCfg.recargo_destino_tipo, recValor=parseFloat(empCfg.recargo_destino_valor)||0;
        if(pago==='destino'&&recValor>0){
          if(recTipo==='porcentaje'){ recargo=Math.round(flete*recValor/100); recargoLabel='Recargo pago en destino ('+recValor+'%)'; }
          else if(recTipo==='monto'){ recargo=Math.round(recValor); recargoLabel='Recargo pago en destino'; }
        }

        var sinIVA=flete+recargo;
        var iva=Math.round(sinIVA*0.21);
        var total=Math.round(sinIVA*1.21);
        var fmt=function(n){return '$'+Math.round(n).toLocaleString('es-AR');};
        var mLabels={deposito_sucursal:'Depósito → Sucursal',deposito_domicilio:'Depósito → Domicilio',domicilio_domicilio:'Domicilio → Domicilio'};
        var pLabels={origen:'Pago en origen',destino:'Pago en destino',sucursal:'Pago en sucursal'};
        var sLabels={estandar:'Estándar',express:'Express 48h',consolidado:'Consolidado'};
        var remLabel=tipoRem==='empresa'?remNom:remAp+', '+remNom;
        var destLabel=tipoDest==='empresa'?destNom:destAp+', '+destNom;
        var dirRem=remCalle+' '+remNum+(remEntre?', entre '+remEntre:'')+(remCP?' (CP '+remCP+')':'');
        var dirDest=destCalle+' '+destNum+(destEntre?', entre '+destEntre:'')+(destCP?' (CP '+destCP+')':'');

        // Guardar datos para el pago
        window._cwCotizacion = {
          origen:origen,destino:destino,peso_kg:peso,volumen_m3:volM3,
          tipo_servicio:servicio,precio_total:total,recargo_destino:recargo,modalidad:modalidad,pago:pago,
          remitente:{tipo:tipoRem,nombre:remNom,apellido:remAp,doc:remDoc,celular:remCel,email:v('cw-rem-email'),calle:remCalle,numero:remNum,entre:remEntre,cp:remCP},
          destinatario:{tipo:tipoDest,nombre:destNom,apellido:destAp,doc:destDoc,celular:destCel,email:v('cw-dest-email'),calle:destCalle,numero:destNum,entre:destEntre,cp:destCP}
        };

        document.getElementById('cw-result-box').innerHTML = [
          '<div class="cw-result">',
            '<div class="cw-rprice">'+fmt(total)+'</div>',
            '<div class="cw-runit">ARS · IVA incluido (21%) · <span style="color:#f97316;font-weight:600">⚠️ Precio sujeto a modificación según pesaje real en sucursal</span></div>',
            '<div class="cw-rbadge">⏱ '+data.plazo+'</div>',
            '<div class="cw-rrows">',
              (recargo>0
                ? '<div class="cw-rrow"><span>Flete</span><span>'+fmt(flete)+'</span></div>'+
                  '<div class="cw-rrow"><span>'+recargoLabel+'</span><span>+'+fmt(recargo)+'</span></div>'
                : ''),
              '<div class="cw-rrow"><span>Precio sin IVA</span><span>'+fmt(sinIVA)+'</span></div>',
              '<div class="cw-rrow"><span>IVA (21%)</span><span>'+fmt(iva)+'</span></div>',
              '<div class="cw-rrow"><span>Peso efectivo</span><span>'+data.peso_efectivo_kg+' kg</span></div>',
              '<div class="cw-rrow"><span>Servicio</span><span>'+sLabels[servicio]+'</span></div>',
              '<div class="cw-rrow"><span>Modalidad</span><span>'+mLabels[modalidad]+'</span></div>',
              '<div class="cw-rrow"><span>Pago</span><span>'+pLabels[pago]+'</span></div>',
              '<div class="cw-rrow"><span>Remitente</span><span>'+remLabel+'</span></div>',
              '<div class="cw-rrow"><span>Dir. retiro</span><span>'+dirRem+'</span></div>',
              '<div class="cw-rrow"><span>Destinatario</span><span>'+destLabel+'</span></div>',
              '<div class="cw-rrow"><span>Dir. entrega</span><span>'+dirDest+'</span></div>',
              '<div class="cw-rrow total"><span>Total con IVA</span><span>'+fmt(total)+'</span></div>',
            '</div>',
            '<div class="cw-pay-btns" id="cw-pay-btns">',
              '<button class="cw-pay-btn cw-pay-primary" id="cw-btn-pagar" onclick="cwPagar()">💳 Pagar online</button>',
              '<button class="cw-pay-btn cw-pay-secondary" id="cw-btn-qr" onclick="cwPagarQR()">📱 Pagar con QR</button>',
            '</div>',
            '<div id="cw-sucursal-box" style="display:none;margin-top:16px;background:rgba(255,255,255,.08);border-radius:10px;padding:16px;text-align:center">',
              '<p style="font-size:13px;color:rgba(255,255,255,.8);margin-bottom:8px">📍 Presentate en nuestra sucursal con este resumen para abonar y dejar tu paquete.</p>',
              '<p style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:12px">⚠️ Precio sujeto a modificación según pesaje real en sucursal.</p>',
              '<button id="cw-btn-pdf" disabled onclick="cwGenerarPDF(window._cwNumeroSucursal,\'pendiente_pago\')" style="background:#E8500A;border:none;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;opacity:.5">⏳ Generando número de seguimiento...</button>',
            '</div>',
            '<div class="cw-pago-loading" id="cw-pago-loading">Generando...</div>',
            '<div class="cw-qr-box" id="cw-qr-box">',
              '<p>Escaneá con cualquier app de pago</p>',
              '<img id="cw-qr-img" src="" alt="QR de pago">',
              '<small>Mercado Pago · MODO · Transferencia</small>',
            '</div>',
            '<div class="cw-codigo-box">',
              '<p>Tu código de seguimiento se genera al completar el pago</p>',
              '<div id="cw-codigo" class="cw-codigo" style="opacity:.35">Pendiente...</div>',
            '</div>',
          '</div>'
        ].join('');
            sessionStorage.removeItem('cw_estado');
      // Mostrar u ocultar botones según forma de pago
      var pagarBtns = document.getElementById('cw-pay-btns');
            var sucursalBox = document.getElementById('cw-sucursal-box');




      if (pago === 'sucursal') {
        pagarBtns.style.display = 'none';
        sucursalBox.style.display = 'block';
        cwRegistrarSucursal();
      } else {
        pagarBtns.style.display = 'grid';
        sucursalBox.style.display = 'none';
      }
        cwGoTo(5);
      } catch(e) {
        showErr(e.message);
      } finally {
        btnNext.disabled=false; btnNext.textContent='Ver precio 💰';
      }
    };

    // ── Registrar envío para pago en sucursal y habilitar PDF con el número real
    async function cwRegistrarSucursal() {
      var btn = document.getElementById('cw-btn-pdf');
      var codigo = document.getElementById('cw-codigo');
      var key = JSON.stringify(window._cwCotizacion);
      var setListo = function(numero) {
        window._cwNumeroSucursal = numero;
        codigo.textContent = numero; codigo.style.opacity = '1';
        btn.disabled = false; btn.style.opacity = '1';
        btn.textContent = '📄 Descargar cotización PDF';
      };
      // Evitar crear un envío duplicado si la cotización no cambió
      if (window._cwSucursalKey === key && window._cwNumeroSucursal) return setListo(window._cwNumeroSucursal);
      window._cwNumeroSucursal = null;
      try {
        var r = await fetch(API_BASE+'/api/pagos/'+empresa+'/sucursal',{method:'POST',headers:{'Content-Type':'application/json'},body:key});
        var d = await r.json();
        if (!r.ok) throw new Error(d.error||'Error al registrar el envío');
        window._cwSucursalKey = key;
        setListo(d.numero_seguimiento);
      } catch(e) {
        btn.textContent = '⚠️ Error, tocá para reintentar';
        btn.disabled = false; btn.style.opacity = '1';
        btn.onclick = function() {
          btn.onclick = function() { cwGenerarPDF(window._cwNumeroSucursal,'pendiente_pago'); };
          btn.disabled = true; btn.style.opacity = '.5';
          btn.textContent = '⏳ Generando número de seguimiento...';
          cwRegistrarSucursal();
        };
      }
    }

    // ── Pagar online
    window.cwPagar = async function() {
      if(!window._cwCotizacion) return;
      var btn=document.getElementById('cw-btn-pagar');
      var load=document.getElementById('cw-pago-loading');
      btn.disabled=true; load.textContent='Redirigiendo a Mercado Pago...'; load.style.display='block';
      try {
        var r=await fetch(API_BASE+'/api/pagos/'+empresa+'/crear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(window._cwCotizacion)});
        var d=await r.json();
        if(!r.ok) throw new Error(d.error||'Error al crear el pago');
        // Guardar cotización y estado antes de redirigir
        sessionStorage.setItem('cw_cotizacion', JSON.stringify(window._cwCotizacion));
        sessionStorage.setItem('cw_origen_url', window.location.href);
        sessionStorage.setItem('cw_estado', JSON.stringify({
          modalidad: modalidad,
          tipoRem: tipoRem,
          tipoDest: tipoDest,
          paso: 5,
          campos: {
            origen: document.getElementById('cw-origen')?.value,
            destino: document.getElementById('cw-destino')?.value,
            peso: document.getElementById('cw-peso')?.value,
            bultos: document.getElementById('cw-bultos')?.value,
            largo: document.getElementById('cw-largo')?.value,
            ancho: document.getElementById('cw-ancho')?.value,
            alto: document.getElementById('cw-alto')?.value,
            servicio: document.getElementById('cw-servicio')?.value,
            pago: document.getElementById('cw-pago')?.value,
            remNom: document.getElementById('cw-rem-nom')?.value,
            remAp: document.getElementById('cw-rem-ap')?.value,
            remDoc: document.getElementById('cw-rem-doc')?.value,
            remCel: document.getElementById('cw-rem-cel')?.value,
            remEmail: document.getElementById('cw-rem-email')?.value,
            remCalle: document.getElementById('cw-rem-calle')?.value,
            remNum: document.getElementById('cw-rem-num')?.value,
            remCP: document.getElementById('cw-rem-cp')?.value,
            destNom: document.getElementById('cw-dest-nom')?.value,
            destAp: document.getElementById('cw-dest-ap')?.value,
            destDoc: document.getElementById('cw-dest-doc')?.value,
            destCel: document.getElementById('cw-dest-cel')?.value,
            destEmail: document.getElementById('cw-dest-email')?.value,
            destCalle: document.getElementById('cw-dest-calle')?.value,
            destNum: document.getElementById('cw-dest-num')?.value,
            destCP: document.getElementById('cw-dest-cp')?.value,
          }
        }));
        window.location.href=d.init_point;
      } catch(e) { alert('Error: '+e.message); btn.disabled=false; load.style.display='none'; }
    };

    // ── Pagar con QR
        // ── Generar PDF
    window.cwGenerarPDF = function(numero, estado) {
      if (typeof window.jspdf === 'undefined') {
        alert('Cargando PDF, intentá de nuevo en un momento.');
        return;
      }
      var doc = new window.jspdf.jsPDF();
      var cot = window._cwCotizacion || {};
      var rem = cot.remitente || {};
      var dest = cot.destinatario || {};
      var emp = window._cwEmpresa || {};
      var fmt = function(n){ return '$' + Math.round(n).toLocaleString('es-AR'); };
      var sinIVA = Math.round((cot.precio_total || 0) / 1.21);
      var iva = Math.round(sinIVA * 0.21);

      // Colores
      var naranja = [232, 80, 10];
      var azul = [11, 30, 61];

      // Header
      doc.setFillColor(azul[0], azul[1], azul[2]);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(emp.nombre || 'Transporte', 14, 16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Cotización de envío', 14, 23);

      // Número de cotización
      doc.setFillColor(naranja[0], naranja[1], naranja[2]);
      doc.rect(130, 6, 70, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO DE SEGUIMIENTO', 165, 12, { align: 'center' });
      doc.setFontSize(12);
      doc.text(numero || 'Pendiente', 165, 19, { align: 'center' });

      // Estado
      doc.setTextColor(azul[0], azul[1], azul[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      var estadoTexto = estado === 'pendiente_pago' ? 'Pendiente de pago' : 'Confirmado ✓';
      doc.text('Estado: ' + estadoTexto, 14, 36);

      // Ruta
      doc.setFillColor(naranja[0], naranja[1], naranja[2]);
      doc.rect(0, 40, 210, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CIUDAD ORIGEN: ' + (cot.origen || '—'), 14, 46);

      doc.setFillColor(naranja[0], naranja[1], naranja[2]);
      doc.rect(0, 50, 210, 8, 'F');
      doc.text('CIUDAD DESTINO: ' + (cot.destino || '—'), 14, 56);

      // Datos del envío
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      var y = 68;
      var col1 = 14, col2 = 110;

      doc.setFont('helvetica', 'bold');
      doc.text('Remitente:', col1, y);
      doc.setFont('helvetica', 'normal');
      doc.text((rem.nombre || '') + ' ' + (rem.apellido || ''), col1 + 28, y);
      doc.setFont('helvetica', 'bold');
      doc.text('Destinatario:', col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text((dest.nombre || '') + ' ' + (dest.apellido || ''), col2 + 30, y);
      y += 7;

      doc.setFont('helvetica', 'bold');
      doc.text('Dirección retiro:', col1, y);
      doc.setFont('helvetica', 'normal');
      doc.text((rem.calle || '') + ' ' + (rem.numero || ''), col1 + 36, y);
      doc.setFont('helvetica', 'bold');
      doc.text('Dirección entrega:', col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text((dest.calle || '') + ' ' + (dest.numero || ''), col2 + 38, y);
      y += 7;

      doc.setFont('helvetica', 'bold');
      doc.text('Celular:', col1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(rem.celular || '—', col1 + 18, y);
      doc.setFont('helvetica', 'bold');
      doc.text('Celular:', col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(dest.celular || '—', col2 + 18, y);
      y += 12;

      // Detalles del envío
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setTextColor(azul[0], azul[1], azul[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('DETALLE DEL ENVÍO', 14, y + 1);
      y += 10;

      var sLabels = {estandar:'Estándar', express:'Express 48h', consolidado:'Consolidado'};
      var pLabels = {origen:'Pago en origen', destino:'Pago en destino', sucursal:'Pago en sucursal'};
      var mLabels = {deposito_sucursal:'Depósito → Sucursal', deposito_domicilio:'Depósito → Domicilio', domicilio_domicilio:'Domicilio → Domicilio'};

      var detalles = [
        ['Servicio', sLabels[cot.tipo_servicio] || cot.tipo_servicio || '—'],
        ['Modalidad', mLabels[cot.modalidad] || '—'],
        ['Forma de pago', pLabels[cot.pago] || '—'],
        ['Peso', (cot.peso_kg || '—') + ' kg'],
      ];

      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      detalles.forEach(function(d) {
        doc.setFont('helvetica', 'bold');
        doc.text(d[0] + ':', col1, y);
        doc.setFont('helvetica', 'normal');
        doc.text(d[1], col1 + 35, y);
        y += 7;
      });

      y += 5;

      // Precio
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setTextColor(azul[0], azul[1], azul[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('PRECIO FINAL DEL ENVÍO: ' + fmt(cot.precio_total || 0), 14, y + 1);
      y += 12;

      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      var precios = [
        ['Flete (sin IVA)', fmt(sinIVA)],
        ['IVA (21%)', fmt(iva)],
        ['Total', fmt(cot.precio_total || 0)],
      ];
      precios.forEach(function(p) {
        doc.text(p[0] + ':', col1, y);
        doc.text(p[1], col1 + 50, y);
        y += 6;
      });

      y += 8;

      // Advertencia
      doc.setFillColor(255, 243, 205);
      doc.rect(14, y - 4, 182, 12, 'F');
      doc.setTextColor(150, 100, 0);
      doc.setFontSize(8);
      doc.text('⚠️ Cotización sujeta a modificación según pesaje real en sucursal. Válida por 30 días.', 14, y + 2);

      // Footer
      doc.setFillColor(azul[0], azul[1], azul[2]);
      doc.rect(0, 277, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Ante cualquier duda, contactanos. Gracias por elegirnos.', 105, 285, { align: 'center' });
      if (emp.telefono) doc.text('Tel: ' + emp.telefono, 105, 291, { align: 'center' });

      doc.save('cotizacion-' + (numero || 'pendiente') + '.pdf');
    };
    window.cwPagarQR = async function() {
      if(!window._cwCotizacion) return;
      var btn=document.getElementById('cw-btn-qr');
      var load=document.getElementById('cw-pago-loading');
      var qrBox=document.getElementById('cw-qr-box');
      btn.disabled=true; load.textContent='Generando QR...'; load.style.display='block'; qrBox.style.display='none';
      try {
        var r=await fetch(API_BASE+'/api/pagos/'+empresa+'/crear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(window._cwCotizacion)});
        var d=await r.json();
        if(!r.ok) throw new Error(d.error||'Error al generar QR');
        var img=document.getElementById('cw-qr-img');
        img.src='https://api.qrserver.com/v1/create-qr-code/?size=170x170&data='+encodeURIComponent(d.init_point);
        img.onload=function(){ load.style.display='none'; qrBox.style.display='block'; };
      } catch(e) { alert('Error: '+e.message); load.style.display='none'; } finally { btn.disabled=false; }
    };

    // ── Rastrear
    window.cwRastrear = async function() {
      var num=document.getElementById('cw-track-input').value.trim().toUpperCase();
      var errEl=document.getElementById('cw-track-err');
      var resEl=document.getElementById('cw-track-result');
      errEl.style.display='none'; resEl.style.display='none';
      if(!num){ errEl.textContent='Ingresá el número de seguimiento.'; errEl.style.display='block'; return; }
      try {
        var r=await fetch(API_BASE+'/api/tracking/'+num);
        var d=await r.json();
        if(!r.ok) throw new Error(d.error||'No encontrado');
        var e=d.envio;
        var col=ESTADO_COLORS[e.estado]||'#6b7280';
        var lbl=ESTADO_LABELS[e.estado]||e.estado;
        var sLabels={estandar:'Estándar',express:'Express 48h',consolidado:'Consolidado'};
        function fmtF(iso){return iso?new Date(iso).toLocaleDateString('es-AR'):'—';}
        document.getElementById('cw-t-estado').textContent=lbl;
        document.getElementById('cw-t-estado').style.cssText='background:'+col+'22;color:'+col+';display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:14px';
        document.getElementById('cw-t-num').textContent=e.numero_seguimiento;
        document.getElementById('cw-t-serv').textContent=sLabels[e.tipo_servicio]||e.tipo_servicio;
        document.getElementById('cw-t-orig').textContent=e.origen;
        document.getElementById('cw-t-dest').textContent=e.destino;
        document.getElementById('cw-t-timeline').innerHTML=d.eventos.slice().reverse().map(function(ev){
          return '<div class="cw-tev"><p>'+(ESTADO_LABELS[ev.estado]||ev.estado)+(ev.descripcion?' — '+ev.descripcion:'')+'</p><small>'+(ev.ubicacion?'📍 '+ev.ubicacion+' · ':'')+new Date(ev.fecha).toLocaleString('es-AR')+'</small></div>';
        }).join('')||'<p style="font-size:13px;color:#6b7280">Sin eventos registrados</p>';
        resEl.style.display='block';
      } catch(e) { errEl.textContent=e.message; errEl.style.display='block'; }
    };

    document.getElementById('cw-track-input').addEventListener('keydown',function(e){if(e.key==='Enter')cwRastrear();});

    // Auto-tracking desde pago exitoso
    var tn=sessionStorage.getItem('tracking_numero');
    if(tn){
      sessionStorage.removeItem('tracking_numero');
      document.getElementById('cw-track-input').value=tn;
      cwTab('tracking',document.querySelectorAll('.cw-tab')[1]);
      cwRastrear();
    }
  }
  // Restaurar campos si hay estado guardado
    function restoreEstado(savedState) {
    var c = savedState.campos;
    if (!c) return;
    if (c.origen) { document.getElementById('cw-origen').value = c.origen; cwFiltrarDestinos(); setTimeout(function(){ if(c.destino) document.getElementById('cw-destino').value = c.destino; }, 100); }
    if (c.peso) document.getElementById('cw-peso').value = c.peso;
    if (c.bultos) document.getElementById('cw-bultos').value = c.bultos;
    if (c.largo) document.getElementById('cw-largo').value = c.largo;
    if (c.ancho) document.getElementById('cw-ancho').value = c.ancho;
    if (c.alto) document.getElementById('cw-alto').value = c.alto;
    cwVol();
    if (c.servicio) document.getElementById('cw-servicio').value = c.servicio;
    if (c.pago) {
      var selPago = document.getElementById('cw-pago');
      selPago.value = c.pago;
      if (!selPago.value) selPago.selectedIndex = 0; // la opción guardada ya no está disponible
    }
    if (c.remNom) document.getElementById('cw-rem-nom').value = c.remNom;
    if (c.remAp) document.getElementById('cw-rem-ap').value = c.remAp;
    if (c.remDoc) document.getElementById('cw-rem-doc').value = c.remDoc;
    if (c.remCel) document.getElementById('cw-rem-cel').value = c.remCel;
    if (c.remEmail) document.getElementById('cw-rem-email').value = c.remEmail;
    if (c.remCalle) document.getElementById('cw-rem-calle').value = c.remCalle;
    if (c.remNum) document.getElementById('cw-rem-num').value = c.remNum;
    if (c.remCP) document.getElementById('cw-rem-cp').value = c.remCP;
    if (c.destNom) document.getElementById('cw-dest-nom').value = c.destNom;
    if (c.destAp) document.getElementById('cw-dest-ap').value = c.destAp;
    if (c.destDoc) document.getElementById('cw-dest-doc').value = c.destDoc;
    if (c.destCel) document.getElementById('cw-dest-cel').value = c.destCel;
    if (c.destEmail) document.getElementById('cw-dest-email').value = c.destEmail;
    if (c.destCalle) document.getElementById('cw-dest-calle').value = c.destCalle;
    if (c.destNum) document.getElementById('cw-dest-num').value = c.destNum;
    if (c.destCP) document.getElementById('cw-dest-cp').value = c.destCP;
    // Restaurar cotización guardada
    var savedCotizacion = sessionStorage.getItem('cw_cotizacion');
    if (savedCotizacion) window._cwCotizacion = JSON.parse(savedCotizacion);
    if (savedState.paso && savedState.paso > 1) setTimeout(function(){ cwGoTo(savedState.paso); }, 300);
  }
  fetch(API_BASE+'/api/widget/'+empresa+'/config')
    .then(function(r){return r.json();})
    .then(buildHTML)
    .catch(function(){
      var el=document.getElementById(containerId);
      if(el) el.innerHTML='<p style="color:red;font-size:13px">Error al cargar el cotizador.</p>';
    });
})();
