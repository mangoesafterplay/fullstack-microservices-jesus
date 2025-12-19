-- Tabla de tokens (Microservicio de Seguridad)
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(8) UNIQUE NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour',
    used_at TIMESTAMP NULL
);

CREATE INDEX idx_token ON tokens(token);
CREATE INDEX idx_token_valid ON tokens(token, is_valid);

-- Tabla de parámetros globales (Microservicio de Clientes)
CREATE TABLE IF NOT EXISTS parametros (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar parámetro de envío de correos
INSERT INTO parametros (clave, valor, descripcion) 
VALUES ('ENVIO_CORREOS_ENABLED', 'true', 'Habilita o deshabilita el envío de correos de bienvenida')
ON CONFLICT (clave) DO NOTHING;

-- Tabla de clientes (Microservicio de Clientes)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    bono_bienvenida DECIMAL(10, 2) DEFAULT 0,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    token_usado VARCHAR(8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_numero_documento ON clientes(numero_documento);
CREATE INDEX idx_fecha_nacimiento ON clientes(fecha_nacimiento);