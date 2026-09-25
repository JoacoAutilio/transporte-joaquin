# Transporte Joaquín — Stack Fullstack

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS 3 |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Deploy recomendado | Vercel (front) + Railway (back + DB) |

---

## Estructura del proyecto
```
transporte-joaquin/
├── backend/
│   ├── routes/
│   │   ├── cotizar.js     # GET /localidades · POST /cotizar
│   │   ├── envios.js      # POST / · GET /:numero · PATCH /:id/estado
│   │   ├── tracking.js    # GET /:numero
│   │   └── clientes.js    # POST / · GET /:id/envios
│   ├── db.js              # Pool de conexión PostgreSQL
│   ├── server.js          # Entry point Express
│   ├── schema.sql         # Tablas + datos iniciales
│   └── .env.example
└── frontend/
    └── src/
        ├── api/index.js   # Llamadas HTTP (axios)
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── Home.jsx
            ├── Cotizador.jsx
            └── Tracking.jsx
```

---

## Setup local

### 1. Base de datos (PostgreSQL)
```bash
createdb transporte_joaquin
psql transporte_joaquin < backend/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Editá .env con tus datos de conexión
npm install
node server.js
# → API en http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → App en http://localhost:5173
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/cotizar/localidades | Lista de localidades disponibles |
| POST | /api/cotizar | Calcular precio estimado |
| POST | /api/envios | Confirmar nuevo envío |
| GET | /api/envios/:numero | Detalle de envío |
| PATCH | /api/envios/:id/estado | Actualizar estado (admin) |
| GET | /api/tracking/:numero | Seguimiento con historial |
| POST | /api/clientes | Registrar cliente |
| GET | /api/clientes/:id/envios | Historial de envíos de un cliente |
| GET | /api/health | Health check |

### Ejemplo: POST /api/cotizar
```json
{
  "origen_id": 1,
  "destino_id": 2,
  "peso_kg": 120,
  "volumen_m3": 0.5,
  "tipo_servicio": "express",
  "con_seguro": true,
  "valor_declarado": 500000
}
```
**Respuesta:**
```json
{
  "precio_base": 8694,
  "precio_seguro": 6000,
  "precio_total": 14694,
  "plazo_dias": "48 hs hábiles",
  "peso_efectivo_kg": 125,
  "moneda": "ARS",
  "iva_incluido": false
}
```

---

## Deploy a producción

### Vercel (Frontend)
```bash
cd frontend
npm run build
# Deploy la carpeta dist/ o conectá el repo a Vercel
# Variable de entorno: VITE_API_URL=https://tu-backend.railway.app
```

### Railway (Backend + PostgreSQL)
1. Crear proyecto en railway.app
2. Agregar servicio PostgreSQL → copiar DATABASE_URL
3. Agregar servicio Node → conectar repo → definir start command: `node server.js`
4. Variables de entorno: `DATABASE_URL`, `PORT=3001`, `NODE_ENV=production`
5. Correr el schema: Railway shell → `psql $DATABASE_URL < schema.sql`

---

## Lógica del cotizador

- **Peso efectivo** = `max(peso_kg, volumen_m3 × 250)` (regla volumétrica estándar)
- **Precio** = `tarifa_base + (excedente_sobre_50kg × precio_por_kg)`
- **Multiplicadores**: Express ×1.35 · Estándar ×1.0 · Consolidado ×0.85
- **Seguro**: 1.2% del valor declarado
