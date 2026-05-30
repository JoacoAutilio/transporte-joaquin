import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const links = [
    { to: '/#servicios', label: 'Servicios' },
    { to: '/cotizar', label: 'Cotizar' },
    { to: '/tracking', label: 'Seguimiento' },
    { to: '/#cobertura', label: 'Cobertura' },
  ];

  return (
    <nav className="bg-navy sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-condensed font-extrabold text-white tracking-wide">
            Transporte <span className="text-brand">Joaquín</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.to} href={l.to}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              {l.label}
            </a>
          ))}
          <a href="/cotizar"
            className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-light transition-colors">
            Cotizar envío
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)} aria-label="Menú">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <><line x1="3" y1="3" x2="19" y2="19"/><line x1="19" y1="3" x2="3" y2="19"/></>
              : <><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="12" x2="19" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy-mid border-t border-white/10 px-4 pb-4">
          {links.map(l => (
            <a key={l.to} href={l.to} onClick={() => setOpen(false)}
              className="block text-white/80 py-3 border-b border-white/10 text-sm font-medium">
              {l.label}
            </a>
          ))}
          <a href="/cotizar"
            className="block mt-3 bg-brand text-white text-center py-3 rounded-lg text-sm font-semibold">
            Cotizar envío
          </a>
        </div>
      )}
    </nav>
  );
}
