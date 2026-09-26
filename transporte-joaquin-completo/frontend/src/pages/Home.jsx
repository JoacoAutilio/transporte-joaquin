const SERVICIOS = [
  { icon: '📦', title: 'Carga general', desc: 'Paquetes, pallets y bultos de todo tipo. Puerta a puerta o a terminal.' },
  { icon: '❄️', title: 'Carga refrigerada', desc: 'Cadena de frío garantizada. Alimentos, medicamentos y productos sensibles.' },
  { icon: '⚡', title: 'Express 48h', desc: 'Entrega garantizada en 48 horas hábiles a todo el país.' },
  { icon: '🏭', title: 'Carga consolidada', desc: 'Agrupá tu mercadería con otros envíos al mismo destino. Menor costo.' },
  { icon: '🔩', title: 'Carga industrial', desc: 'Maquinaria y equipos pesados con equipamiento especializado.' },
  { icon: '📍', title: 'Tracking en vivo', desc: 'Seguí tu envío en tiempo real con notificaciones automáticas.' },
];

const DESTINOS = ['Buenos Aires','Córdoba','Rosario','Mendoza','Neuquén','Salta','Tucumán','Bariloche','Posadas','Corrientes','Río Gallegos','Santa Fe','San Juan','La Plata','Mar del Plata'];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand opacity-[0.06] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-4xl mx-auto relative">
          <span className="inline-block bg-brand text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded mb-5">
            Desde 1998 · Argentina
          </span>
          <h1 className="text-5xl md:text-6xl font-condensed font-extrabold leading-tight mb-4">
            Transporte de cargas<br />
            <span className="text-brand-light">rápido y seguro</span>
          </h1>
          <p className="text-white/65 text-lg max-w-lg leading-relaxed mb-8">
            Llegamos a más de 200 destinos en todo el país. Cargas generales, refrigeradas y consolidadas.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/cotizar" className="bg-brand text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-brand-light transition-colors">
              Cotizar envío →
            </a>
            <a href="/tracking" className="border border-white/35 text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors">
              Rastrear envío
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-brand">
        <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-px">
          {[['200+','Destinos'],['48h','Entrega express'],['25 años','Experiencia'],['99%','A término']].map(([n,l]) => (
            <div key={l} className="text-center py-3 px-4">
              <div className="text-2xl font-condensed font-extrabold text-white">{n}</div>
              <div className="text-xs text-white/80 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <section id="servicios" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-brand">Lo que hacemos</span>
            <h2 className="text-3xl font-condensed font-extrabold text-navy mt-1">Servicios de transporte</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICIOS.map(s => (
              <div key={s.title} className="bg-stone-50 border border-gray-100 rounded-xl p-6 hover:border-brand transition-colors">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-condensed font-bold text-lg text-navy mb-1.5">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-condensed font-extrabold text-white mb-3">¿Tenés un envío para hacer?</h2>
          <p className="text-white/60 mb-6">Cotizá en segundos. Sin registro, sin compromiso.</p>
          <a href="/cotizar" className="inline-block bg-brand text-white font-condensed font-bold text-xl px-10 py-4 rounded-lg hover:bg-brand-light transition-colors">
            Cotizar mi envío →
          </a>
        </div>
      </section>

      {/* Cobertura */}
      <section id="cobertura" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-bold tracking-widest uppercase text-brand">Dónde llegamos</span>
            <h2 className="text-3xl font-condensed font-extrabold text-navy mt-1">Cobertura nacional</h2>
            <p className="text-gray-500 mt-2">Más de 200 destinos en todas las provincias.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DESTINOS.map(d => (
              <span key={d} className="flex items-center gap-1.5 bg-stone-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-navy">
                <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0"></span>
                {d}
              </span>
            ))}
            <span className="flex items-center gap-1.5 bg-brand/10 border border-brand/20 rounded-lg px-3 py-2 text-sm font-medium text-brand">
              + 185 destinos más
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white/55 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-xl font-condensed font-extrabold text-white mb-2">
                Transporte <span className="text-brand">Joaquín</span>
              </div>
              <p className="text-sm leading-relaxed">Más de 25 años conectando el país.</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>📞 0800-345-0000</p>
                <p>✉️ consultas@transportejoaquin.com.ar</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Servicios</h4>
              {['Carga general','Carga refrigerada','Express 48h','Consolidado'].map(s =>
                <p key={s} className="text-sm py-1">{s}</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Empresa</h4>
              {['Quiénes somos','Cobertura','Seguimiento','Contacto'].map(s =>
                <p key={s} className="text-sm py-1">{s}</p>
              )}
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-xs text-center">
            © {new Date().getFullYear()} Transporte Joaquín · Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
