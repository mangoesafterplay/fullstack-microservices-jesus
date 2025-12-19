-- Tabla de correos enviados
CREATE TABLE IF NOT EXISTS correos_enviados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destinatario_email VARCHAR(150) NOT NULL,
    destinatario_nombre VARCHAR(200) NOT NULL,
    asunto VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    cliente_id INT,
    estado ENUM('pendiente', 'enviado', 'fallido') DEFAULT 'enviado',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_destinatario (destinatario_email),
    INDEX idx_estado (estado),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;