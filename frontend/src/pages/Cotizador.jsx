import { useState, useEffect } from 'react';
import { getLocalidades, postCotizar } from '../api';

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

export default function Cotizador() {
  const [localidades, setLocalidades] = useState([]);
  const [form, setForm] = useState({
    origen_id: '', destino_id: '', peso_kg: '', volumen_m3: '',
    tipo_servicio: 'estandar', con_seguro: false, valor_declarado: '',
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getLocalidades().then(setLocalidades).catch(() => {}); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResultado(null);
    if (!form.origen_id || !form.destino_id || !form.peso_kg) {
      setError('Completá origen, destino y peso.'); return;
    }
    setLoading(true);
    try {
      const data = await postCotizar({
        origen_id: +form.origen_id,
        destino_id: +form.destino_id,
        peso_kg: +form.peso_kg,
        volumen_m3: form.volumen_m3 ? +form.volumen_m3 : 0,
        tipo_servicio: form.tipo_servicio,
        con_seguro: form.con_seguro,
        valor_declarado: form.con_seguro ? +form.valor_declarado : 0,
      });
      setResultado(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cotizar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const servicios = [
    { value: 'estandar', label: 'Estándar (3–5 días hábiles)' },
    { value: 'express', label: 'Express 48 hs hábiles (+35%)' },
    { value: 'consolidado', label: 'Consolidado (–15%)' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-xs font-bold tracking-widest uppercase text-brand">Cotizador online</span>
          <h1 className="text-4xl font-condensed font-extrabold text-navy mt-1">¿Cuánto cuesta tu envío?</h1>
          <p className="text-gray-500 mt-2">Precio estimado al instante, sin compromiso ni registro.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="text-xl font-condensed font-bold text-navy">Datos del envío</h2>

            <div>
              <label className="label">Origen</label>
              <select className="input-field" value={form.origen_id} onChange={e => set('origen_id', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre} ({l.provincia})</option>)}
              </select>
            </div>

            <div>
              <label className="label">Destino</label>
              <select className="input-field" value={form.destino_id} onChange={e => set('destino_id', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {localidades.filter(l => l.id !== +form.origen_id).map(l =>
                  <option key={l.id} value={l.id}>{l.nombre} ({l.provincia})</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Peso (kg)</label>
                <input className="input-field" type="number" min="0.1" step="0.1" placeholder="0"
                  value={form.peso_kg} onChange={e => set('peso_kg', e.target.value)} />
              </div>
              <div>
                <label className="label">Volumen (m³)</label>
                <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.volumen_m3} onChange={e => set('volumen_m3', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Tipo de servicio</label>
              <select className="input-field" value={form.tipo_servicio} onChange={e => set('tipo_servicio', e.target.value)}>
                {servicios.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand"
                  checked={form.con_seguro} onChange={e => set('con_seguro', e.target.checked)} />
                <span className="text-sm font-medium text-gray-700">Agregar seguro de carga (1.2% del valor)</span>
              </label>
            </div>

            {form.con_seguro && (
              <div>
                <label className="label">Valor declarado ($)</label>
                <input className="input-field" type="number" min="0" placeholder="0"
                  value={form.valor_declarado} onChange={e => set('valor_declarado', e.target.value)} />
              </div>
            )}

            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-brand text-white font-condensed font-bold text-lg py-3.5 rounded-lg hover:bg-brand-light transition-colors disabled:opacity-60">
              {loading ? 'Calculando...' : 'Calcular precio →'}
            </button>
          </form>

          {/* Resultado */}
          <div className={`rounded-xl p-6 ${resultado ? 'bg-navy' : 'bg-navy/90 flex flex-col justify-center'}`}>
            {!resultado ? (
              <div className="text-center text-white/40 space-y-3">
                <svg className="w-14 h-14 mx-auto opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <p className="text-sm">Completá el formulario y calculá el costo de tu envío al instante.</p>
              </div>
            ) : (
              <div className="text-white">
                <p className="text-xs font-bold tracking-widest uppercase text-white/50 mb-3">Precio estimado</p>
                <div className="text-5xl font-condensed font-extrabold leading-none mb-1">
                  {fmt(resultado.precio_total)}
                </div>
                <p className="text-white/40 text-sm mb-4">IVA no incluido · Precio referencial</p>

                <span className="inline-block bg-brand/25 text-brand-light text-sm font-semibold px-4 py-1.5 rounded-full">
                  ⏱ Plazo: {resultado.plazo_dias}
                </span>

                <div className="mt-6 pt-5 border-t border-white/15 space-y-2.5">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Tarifa ({resultado.tipo_servicio})</span>
                    <span>{fmt(resultado.precio_base)}</span>
                  </div>
                  {resultado.precio_seguro > 0 && (
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Seguro de carga (1.2%)</span>
                      <span>{fmt(resultado.precio_seguro)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Peso efectivo</span>
                    <span>{resultado.peso_efectivo_kg} kg</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-white/15">
                    <span>Total estimado</span>
                    <span>{fmt(resultado.precio_total)}</span>
                  </div>
                </div>

                <a href="/contacto"
                  className="block mt-5 text-center bg-brand text-white font-condensed font-bold text-lg py-3 rounded-lg hover:bg-brand-light transition-colors">
                  Confirmar envío →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
