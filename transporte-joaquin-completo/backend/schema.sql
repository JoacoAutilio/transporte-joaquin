-- ============================================================
-- Transporte Joaquín · Schema PostgreSQL
-- ============================================================

CREATE TABLE provincias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE localidades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  provincia_id INT REFERENCES provincias(id),
  codigo_postal VARCHAR(10)
);

CREATE TABLE tarifas (
  id SERIAL PRIMARY KEY,
  origen_id INT REFERENCES localidades(id),
  destino_id INT REFERENCES localidades(id),
  precio_base NUMERIC(12,2) NOT NULL,        -- precio por hasta 50kg
  precio_por_kg NUMERIC(8,2) NOT NULL,       -- adicional por kg
  precio_por_m3 NUMERIC(8,2) NOT NULL,       -- adicional por m³
  plazo_dias_min INT NOT NULL,
  plazo_dias_max INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  razon_social VARCHAR(200) NOT NULL,
  cuit VARCHAR(15) UNIQUE,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  direccion TEXT,
  localidad_id INT REFERENCES localidades(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE envios (
  id SERIAL PRIMARY KEY,
  numero_seguimiento VARCHAR(20) UNIQUE NOT NULL,
  cliente_id INT REFERENCES clientes(id),
  origen_id INT REFERENCES localidades(id),
  destino_id INT REFERENCES localidades(id),
  tarifa_id INT REFERENCES tarifas(id),
  tipo_servicio VARCHAR(20) CHECK (tipo_servicio IN ('estandar','express','consolidado')) DEFAULT 'estandar',
  peso_kg NUMERIC(10,2) NOT NULL,
  volumen_m3 NUMERIC(10,3),
  peso_efectivo_kg NUMERIC(10,2),            -- max(peso, volumen*250)
  valor_declarado NUMERIC(12,2) DEFAULT 0,
  con_seguro BOOLEAN DEFAULT FALSE,
  precio_base NUMERIC(12,2),
  precio_seguro NUMERIC(12,2) DEFAULT 0,
  precio_total NUMERIC(12,2),
  estado VARCHAR(30) CHECK (estado IN ('presupuesto','confirmado','en_transito','en_destino','entregado','cancelado')) DEFAULT 'presupuesto',
  descripcion_carga TEXT,
  fecha_retiro DATE,
  fecha_entrega_estimada DATE,
  fecha_entrega_real TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tracking (
  id SERIAL PRIMARY KEY,
  envio_id INT REFERENCES envios(id) ON DELETE CASCADE,
  estado VARCHAR(30) NOT NULL,
  descripcion TEXT,
  ubicacion VARCHAR(200),
  fecha TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_envios_seguimiento ON envios(numero_seguimiento);
CREATE INDEX idx_envios_cliente ON envios(cliente_id);
CREATE INDEX idx_envios_estado ON envios(estado);
CREATE INDEX idx_tracking_envio ON tracking(envio_id);
CREATE INDEX idx_tarifas_ruta ON tarifas(origen_id, destino_id);

-- Trigger: actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_envios_updated BEFORE UPDATE ON envios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Datos iniciales
-- ============================================================

INSERT INTO provincias (nombre, codigo) VALUES
  ('Buenos Aires', 'BA'), ('Córdoba', 'CBA'), ('Santa Fe', 'SF'),
  ('Mendoza', 'MZA'), ('Neuquén', 'NQN'), ('Salta', 'SAL'),
  ('Tucumán', 'TUC'), ('Río Negro', 'RN');

INSERT INTO localidades (nombre, provincia_id, codigo_postal) VALUES
  ('Buenos Aires / AMBA', 1, '1000'),
  ('Córdoba Capital',     2, '5000'),
  ('Rosario',             3, '2000'),
  ('Santa Fe Capital',    3, '3000'),
  ('Mendoza Capital',     4, '5500'),
  ('Neuquén Capital',     5, '8300'),
  ('Salta Capital',       6, '4400'),
  ('Tucumán Capital',     7, '4000'),
  ('Bariloche',           8, '8400');

INSERT INTO tarifas (origen_id, destino_id, precio_base, precio_por_kg, precio_por_m3, plazo_dias_min, plazo_dias_max) VALUES
  (1, 2, 4200,  28, 7000, 2, 3),
  (2, 1, 4200,  28, 7000, 2, 3),
  (1, 3, 2800,  18, 4500, 1, 2),
  (3, 1, 2800,  18, 4500, 1, 2),
  (1, 4, 3100,  20, 5000, 2, 3),
  (4, 1, 3100,  20, 5000, 2, 3),
  (1, 5, 6500,  42, 10500, 3, 4),
  (5, 1, 6500,  42, 10500, 3, 4),
  (1, 6, 8200,  54, 13500, 4, 5),
  (6, 1, 8200,  54, 13500, 4, 5),
  (1, 7, 9800,  65, 16000, 5, 6),
  (7, 1, 9800,  65, 16000, 5, 6),
  (1, 8, 8900,  58, 14500, 4, 5),
  (8, 1, 8900,  58, 14500, 4, 5),
  (1, 9, 11500, 76, 19000, 5, 6),
  (9, 1, 11500, 76, 19000, 5, 6),
  (2, 3, 2400,  16, 4000, 1, 2),
  (3, 2, 2400,  16, 4000, 1, 2),
  (2, 5, 5200,  34, 8500, 3, 4),
  (5, 2, 5200,  34, 8500, 3, 4);
