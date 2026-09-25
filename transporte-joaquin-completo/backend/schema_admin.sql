CREATE TABLE IF NOT EXISTS vehiculos (
  id SERIAL PRIMARY KEY,
  empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
  patente VARCHAR(10) NOT NULL,
  marca VARCHAR(80) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('camion','camioneta','utilitaria')) DEFAULT 'camion',
  año INT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS choferes (
  id SERIAL PRIMARY KEY,
  empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dni VARCHAR(15) UNIQUE NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(150),
  vehiculo_id INT REFERENCES vehiculos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS widget_envios (
  id SERIAL PRIMARY KEY,
  empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
  origen VARCHAR(150) NOT NULL,
  destino VARCHAR(150) NOT NULL,
  peso_kg NUMERIC(10,2),
  tipo_servicio VARCHAR(20) DEFAULT 'estandar',
  precio_total NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_choferes_empresa ON choferes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_empresa ON vehiculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_widget_envios_empresa ON widget_envios(empresa_id);
