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

-- Campos para remito
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS volumen_m3 NUMERIC(10,3);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS alto_cm NUMERIC(8,2);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS ancho_cm NUMERIC(8,2);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS largo_cm NUMERIC(8,2);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS bultos INT DEFAULT 1;
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS peso_real_kg NUMERIC(10,2);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS precio_ajustado NUMERIC(12,2);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS observaciones_recepcion TEXT;
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS remito_confirmado_at TIMESTAMP;
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS remito_confirmado_por VARCHAR(100);

-- Campos de configuración de empresa
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cuit VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion_deposito TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo_prefijo VARCHAR(10) DEFAULT 'ENV';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS recargo_destino_tipo VARCHAR(20) DEFAULT 'sin_recargo';
UPDATE empresas SET recargo_destino_tipo = 'sin_recargo' WHERE recargo_destino_tipo = 'ninguno' OR recargo_destino_tipo IS NULL;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS recargo_destino_valor NUMERIC(8,2) DEFAULT 0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_peso_kg NUMERIC(10,2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_largo_cm NUMERIC(8,2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_ancho_cm NUMERIC(8,2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_alto_cm NUMERIC(8,2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_volumen_m3 NUMERIC(10,3);

-- Valor declarado de la mercadería
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS valor_declarado NUMERIC(12,2);
