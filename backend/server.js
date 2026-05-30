require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Logging básico
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/cotizar',  require('./routes/cotizar'));
app.use('/api/envios',   require('./routes/envios'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/clientes', require('./routes/clientes'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Endpoint no encontrado' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`🚛 Transporte Joaquín API corriendo en puerto ${PORT}`));
