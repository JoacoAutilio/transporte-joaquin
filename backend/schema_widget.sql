CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  color_primario VARCHAR(7) DEFAULT '#E8500A',
  color_secundario VARCHAR(7) DEFAULT '#0B1E3D',
  logo_url TEXT,
  telefono VARCHAR(30),
  email VARCHAR(150),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empresas_tarifas (
  id SERIAL PRIMARY KEY,
  empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
  origen VARCHAR(150) NOT NULL,
  destino VARCHAR(150) NOT NULL,
  precio_base NUMERIC(12,2) NOT NULL,
  precio_por_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  plazo_dias_min INT NOT NULL DEFAULT 1,
  plazo_dias_max INT NOT NULL DEFAULT 5,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
CREATE INDEX IF NOT EXISTS idx_tarifas_empresa ON empresas_tarifas(empresa_id);
