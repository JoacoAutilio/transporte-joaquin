require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const initDB = require('./initDB');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/cotizar',  require('./routes/cotizar'));
app.use('/api/envios',   require('./routes/envios'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/widget',   require('./routes/widget'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/tarifas',  require('./routes/tarifas'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.use((_req, res) => res.status(404).json({ error: 'Endpoint no encontrado' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Error interno' }); });

// Inicializar DB y luego arrancar el servidor
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚛 API corriendo en puerto ${PORT}`));
}).catch(err => {
  console.error('Error iniciando DB:', err);
  process.exit(1);
});
