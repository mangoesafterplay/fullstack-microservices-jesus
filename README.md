# Aplicación Fullstack - Microservicios

Sistema de registro de clientes construido con arquitectura de microservicios, utilizando Angular, Node.js (Hapi), PostgreSQL, MySQL, Redis y RabbitMQ.

## Arquitectura

```
┌──────────────┐
│   Angular    │  Puerto 4200
│  Frontend    │
└──────┬───────┘
       │ HTTP
┌──────▼──────────┐
│ MS Seguridad    │  Puerto 3001 → PostgreSQL
│ Hapi + Node     │
└──────┬──────────┘
       │ HTTP (validación token)
┌──────▼──────────┐
│ MS Clientes     │  Puerto 3002 → PostgreSQL + Redis
│ Hapi + Node     │
└──────┬──────────┘
       │ RabbitMQ
┌──────▼──────────┐
│ MS Correos      │  Puerto 3003 → MySQL
│ Hapi + Node     │
└─────────────────┘
```

## Tecnologías

- **Frontend**: Angular 21.0.3, TypeScript, SCSS
- **Backend**: Node.js 22.15.0, Hapi Framework
- **Bases de datos**: PostgreSQL 15, MySQL 8, Redis 7
- **Message Broker**: RabbitMQ 3
- **Contenedores**: Docker, Docker Compose

## Estructura del Proyecto

```
fullstack-microservices-jesus/
├── frontend-angular/          # Frontend Angular
├── ms-seguridad/             # Microservicio de Seguridad
├── ms-clientes/              # Microservicio de Clientes
├── ms-correos/               # Microservicio de Correos
├── docker-compose.yml        # Orquestación de contenedores
├── init-db.sql              # Script PostgreSQL
├── init-mysql.sql           # Script MySQL
└── README.md
```

## Inicio Rápido

### Prerrequisitos

- Docker Desktop instalado
- Docker Compose instalado
- Git

### Instalación y Ejecución

1. **Clonar el repositorio**:
```bash
git clone https://github.com/mangoesafterplay/fullstack-microservices-jesus.git
cd fullstack-microservices-jesus
```

2. **Construir y levantar todos los servicios**:
```bash
docker-compose up --build
```

3. **Esperar a que todos los servicios estén listos** (aproximadamente 2-3 minutos)

4. **Acceder a la aplicación**:
   - Frontend: http://localhost:4200
   - MS Seguridad: http://localhost:3001
   - MS Clientes: http://localhost:3002
   - MS Correos: http://localhost:3003
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

## Puertos Utilizados

| Servicio        | Puerto | URL                    |
|----------------|--------|------------------------|
| Frontend       | 4200   | http://localhost:4200  |
| MS Seguridad   | 3001   | http://localhost:3001  |
| MS Clientes    | 3002   | http://localhost:3002  |
| MS Correos     | 3003   | http://localhost:3003  |
| PostgreSQL     | 5432   | localhost:5432         |
| MySQL          | 3306   | localhost:3306         |
| Redis          | 6379   | localhost:6379         |
| RabbitMQ       | 5672   | localhost:5672         |
| RabbitMQ UI    | 15672  | http://localhost:15672 |

## Credenciales

### PostgreSQL
- Usuario: `admin`
- Contraseña: `admin123`
- Base de datos: `microservices_db`

### MySQL
- Usuario: `correo_user`
- Contraseña: `correo123`
- Base de datos: `correos_db`

### RabbitMQ
- Usuario: `guest`
- Contraseña: `guest`

## Flujo de la Aplicación

1. **Usuario abre el formulario** → Se genera automáticamente un token de 8 dígitos
2. **Usuario completa el formulario** → Puede editar el token manualmente
3. **Al enviar el formulario**:
   - MS Clientes valida el token con MS Seguridad
   - Se valida que el cliente sea mayor de 18 años
   - Se registra el cliente en PostgreSQL
   - Se marca el token como usado
   - Se consulta parámetro de envío de correos en Redis
   - Si está habilitado, se envía mensaje a RabbitMQ
4. **MS Correos recibe el mensaje** → Registra el "envío" en MySQL

## Probar la Aplicación

### Desde el Frontend

1. Acceder a http://localhost:4200
2. Completar el formulario de registro
3. Click en "Registrar Cliente"
4. Verificar el mensaje de éxito

### Verificar en Bases de Datos

**PostgreSQL (Tokens y Clientes)**:
```bash
docker exec -it postgres_db psql -U admin -d microservices_db

# Ver tokens generados
SELECT * FROM tokens;

# Ver clientes registrados
SELECT * FROM clientes;
```

**MySQL (Correos)**:
```bash
docker exec -it mysql_db mysql -u correo_user -pcorreo123 correos_db

# Ver correos "enviados"
SELECT * FROM correos_enviados;
```

**Redis (Parámetros)**:
```bash
docker exec -it redis_cache redis-cli

# Ver parámetros cargados
KEYS param:*
GET param:ENVIO_CORREOS_ENABLED
```
