import { useState } from 'react';
import { getTracking } from '../api';

const estadoConfig = {
  confirmado:   { label: 'Confirmado',    color: 'text-blue-600',  bg: 'bg-blue-50',  icon: '✓' },
  en_transito:  { label: 'En tránsito',   color: 'text-amber-600', bg: 'bg-amber-50', icon: '🚛' },
  en_destino:   { label: 'En destino',    color: 'text-purple-600',bg: 'bg-purple-50',icon: '📦' },
  entregado:    { label: 'Entregado',     color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
  cancelado:    { label: 'Cancelado',     color: 'text-red-600',   bg: 'bg-red-50',   icon: '✗' },
  presupuesto:  { label: 'Presupuesto',   color: 'text-gray-600',  bg: 'bg-gray-50',  icon: '📋' },
};

const fmt = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export default function Tracking() {
  const [numero, setNumero] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscar = async (e) => {
    e.preventDefault();
    if (!numero.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await getTracking(numero.trim().toUpperCase());
      setData(res);
    } catch (e) {
      setError(e.response?.status === 404
        ? 'No encontramos ese número de seguimiento.'
        : 'Error al consultar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = data ? (estadoConfig[data.envio.estado] || estadoConfig.confirmado) : null;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <span className="text-xs font-bold tracking-widest uppercase text-brand">Seguimiento</span>
          <h1 className="text-4xl font-condensed font-extrabold text-navy mt-1">Rastreá tu envío</h1>
          <p className="text-gray-500 mt-2">Ingresá el número de seguimiento que recibiste al confirmar.</p>
        </div>

        <form onSubmit={buscar} className="flex gap-3 mb-8">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand bg-white uppercase"
            placeholder="Ej: TJ-2025-123456"
            value={numero}
            onChange={e => setNumero(e.target.value.toUpperCase())}
          />
          <button type="submit" disabled={loading}
            className="bg-brand text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-light transition-colors disabled:opacity-60 whitespace-nowrap">
            {loading ? '...' : 'Buscar'}
          </button>
        </form>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {data && (
          <div className="space-y-4">
            {/* Estado actual */}
            <div className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Número de seguimiento</p>
                  <p className="font-condensed font-bold text-navy text-xl">{data.envio.numero_seguimiento}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Origen</p>
                  <p className="font-medium text-gray-800 mt-0.5">{data.envio.origen}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Destino</p>
                  <p className="font-medium text-gray-800 mt-0.5">{data.envio.destino}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Fecha de retiro</p>
                  <p className="font-medium text-gray-800 mt-0.5">{data.envio.fecha_retiro || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Entrega estimada</p>
                  <p className="font-medium text-gray-800 mt-0.5">{data.envio.fecha_entrega_estimada || '—'}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h2 className="text-lg font-condensed font-bold text-navy mb-4">Historial de movimientos</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-5">
                  {data.eventos.slice().reverse().map((ev, i) => {
                    const c = estadoConfig[ev.estado] || estadoConfig.confirmado;
                    return (
                      <div key={i} className="flex gap-4 relative pl-10">
                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${c.bg} ${c.color} border-2 border-white shadow-sm`}>
                          {c.icon}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={`font-semibold text-sm ${c.color}`}>{c.label}</p>
                          {ev.descripcion && <p className="text-gray-600 text-sm mt-0.5">{ev.descripcion}</p>}
                          {ev.ubicacion && <p className="text-gray-400 text-xs mt-0.5">📍 {ev.ubicacion}</p>}
                          <p className="text-gray-400 text-xs mt-1">{fmt(ev.fecha)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
