const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('DB pool error:', err));

// Migraciones automáticas
async function runMigrations() {
  const migrations = [
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS volumen_m3 NUMERIC(10,3)`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS alto_cm NUMERIC(8,2)`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS ancho_cm NUMERIC(8,2)`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS largo_cm NUMERIC(8,2)`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS bultos INT DEFAULT 1`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS peso_real_kg NUMERIC(10,2)`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS precio_ajustado NUMERIC(12,2)`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS observaciones_recepcion TEXT`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS remito_confirmado_at TIMESTAMP`,
    `ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS remito_confirmado_por VARCHAR(100)`,
  ];
  for (const sql of migrations) {
    try { await pool.query(sql); } catch(e) { console.error('Migration error:', e.message); }
  }
  console.log('Migraciones completadas');
}

runMigrations();

module.exports = pool;