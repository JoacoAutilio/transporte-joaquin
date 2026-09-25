-- Agregar columnas a widget_envios para pagos y tracking completo
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS numero_seguimiento VARCHAR(20) UNIQUE;
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS estado VARCHAR(30) DEFAULT 'pendiente_pago';
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(50);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS remitente_json TEXT;
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS destinatario_json TEXT;
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS modalidad VARCHAR(30);
ALTER TABLE widget_envios ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(20);

-- Tabla de tracking de envíos del widget
CREATE TABLE IF NOT EXISTS tracking_widget (
  id SERIAL PRIMARY KEY,
  envio_id INT REFERENCES widget_envios(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  descripcion TEXT,
  ubicacion VARCHAR(200),
  fecha TIMESTAMP DEFAULT NOW()
);

-- Agregar Access Token de MP por empresa
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mp_access_token TEXT;

CREATE INDEX IF NOT EXISTS idx_widget_envios_numero ON widget_envios(numero_seguimiento);
CREATE INDEX IF NOT EXISTS idx_widget_envios_estado ON widget_envios(estado);
CREATE INDEX IF NOT EXISTS idx_tracking_widget_envio ON tracking_widget(envio_id);
