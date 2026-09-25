-- ============================================================
-- AUTH + TARIFAS POR EMPRESA
-- ============================================================

-- Agregar columnas de auth a empresas (si no existen)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email_admin VARCHAR(150);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP;

-- Actualizar empresas_tarifas para más detalle
ALTER TABLE empresas_tarifas ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Sesiones / tokens invalidados (logout)
CREATE TABLE IF NOT EXISTS auth_tokens_blacklist (
  id SERIAL PRIMARY KEY,
  token_jti VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Demo: crear usuario admin para empresa demo
-- Password: demo1234 (el hash se genera al registrar, esto es solo referencia)
-- En producción se usa el endpoint POST /api/auth/register

CREATE INDEX IF NOT EXISTS idx_empresas_email ON empresas(email_admin);
