'use client';

import { useState } from 'react';

export default function Home() {
  const [peso, setPeso] = useState('');
  const [largo, setLargo] = useState('');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [precio, setPrecio] = useState(0);

  const calcularPrecio = () => {
    const volumen = (Number(largo) * Number(ancho) * Number(alto)) / 6000;
    const pesoFinal = Math.max(Number(peso), volumen);
    const total = 3500 + pesoFinal * 1200;
    setPrecio(total);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#0A2A66] text-white p-6 flex justify-between">
        <h1 className="text-4xl font-black">TRANSPORTE JOAQUÍN</h1>
      </header>

      <section className="max-w-5xl mx-auto py-20 px-8">
        <div className="bg-white p-8 rounded-3xl shadow-2xl">
          <h2 className="text-4xl font-black text-[#0A2A66] mb-8">
            Cotizador Web
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Peso" value={peso} onChange={(e)=>setPeso(e.target.value)} className="border p-4 rounded-xl"/>
            <input placeholder="Largo" value={largo} onChange={(e)=>setLargo(e.target.value)} className="border p-4 rounded-xl"/>
            <input placeholder="Ancho" value={ancho} onChange={(e)=>setAncho(e.target.value)} className="border p-4 rounded-xl"/>
            <input placeholder="Alto" value={alto} onChange={(e)=>setAlto(e.target.value)} className="border p-4 rounded-xl"/>
          </div>

          <button
            onClick={calcularPrecio}
            className="w-full mt-8 bg-orange-500 text-white p-5 rounded-2xl text-xl font-bold"
          >
            Calcular
          </button>

          <div className="mt-8 bg-slate-100 p-6 rounded-2xl">
            <h4 className="text-2xl font-bold mb-2">
              Precio estimado
            </h4>

            <p className="text-5xl font-black text-orange-500">
              ${precio.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}