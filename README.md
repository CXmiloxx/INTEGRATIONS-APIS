<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">API de Integraciones - Consumidor de APIs Externas</h1>

<p align="center">
  Una <strong>API de APIs</strong> construida con <strong>NestJS</strong> que actúa como intermediaria para consumir y unificar información de diversas APIs externas, específicamente <strong>ADRES (Base de Datos de Usuarios Afiliados)</strong> del sistema de salud colombiano.
</p>

---

## 🎯 Descripción

Esta es una API de propósito agregador que consume APIs externas y expone la información de forma estructurada, validada y documentada. Actualmente integra la API de **ADRES** para consultar información detallada de afiliados al sistema de salud colombiano.

### Propósito Principal

- **Intermediaria de APIs**: Actúa como una capa de abstracción entre clientes frontend y APIs externas
- **Unificación de datos**: Normaliza y estructura respuestas de múltiples APIs externas
- **Web Scraping**: Extrae información de APIs que requieren navegación complicada (ADRES)
- **Manejo de sesiones**: Gestiona cookies, tokens y parámetros de seguridad automáticamente
- **Documentación automática**: Genera documentación interactiva con Swagger/OpenAPI

---

## 📋 Características Principales

### 1. Integración ADRES
Consulta información de afiliados al sistema de salud colombiano:
- **Información Básica**: Identificación, nombres, apellidos, fecha de nacimiento, ubicación
- **Datos de Afiliación**: Estado, entidad (EPS), régimen, fechas de afiliación
- **Manejo de Sesiones**: Extrae automáticamente tokens y cookies del servidor ADRES
- **Web Scraping**: Parsea HTML usando Cheerio para extraer datos estructurados

### 2. Arquitectura Modular
Estructura basada en dominios de NestJS:
- **Módulos independientes**: Cada integración es un módulo auto-contenido
- **Separación de responsabilidades**: Controllers, Services y DTOs claramente diferenciados
- **HTTP Client centralizado**: Gestión unificada de clientes HTTP con configuraciones específicas

### 3. Seguridad y Validación
- **DTOs con validación**: Todas las entradas se validan con class-validator
- **Variables de seguridad**: Manejo de parámetros sensibles desde variables de entorno
- **CORS configurado**: Control de orígenes permitidos
- **Tipado estricto**: TypeScript con strict: true

### 4. Documentación API
- **Swagger/OpenAPI**: Documentación interactiva en `/api/v1/docs`
- **Esquemas detallados**: Ejemplos de request/response para cada endpoint
- **Manejo de errores**: Documentación de códigos de error (400, 500, etc.)

---

## 🏗️ Estructura del Proyecto

```
src/
├── app.module.ts                 # Módulo raíz
├── main.ts                       # Punto de entrada, configuración de Swagger
├── common/
│   ├── http/                     # Cliente HTTP centralizado
│   │   ├── http-client.service.ts
│   │   ├── http-client.config.ts
│   │   ├── http.module.ts
│   │   └── index.ts
│   └── index.ts
├── config/
│   ├── env.config.ts             # Configuración de variables de entorno
│   ├── logger.config.ts          # Configuración de logging
│   ├── service/
│   │   └── typed-config.service.ts # Servicio tipado de configuración
│   ├── types/
│   │   └── config.types.ts       # Tipos de configuración
│   └── index.ts
├── core/
│   └── adres/                    # Módulo de integración ADRES
│       ├── adres.module.ts
│       ├── adres.controller.ts
│       ├── adres.service.ts
│       └── dto/
│           └── buscar-afiliado.dto.ts
└── types/
    └── afiliado.types.ts         # Tipos y enums para ADRES
```

---

## 🚀 Instalación y Uso

### Requisitos Previos
- **Node.js**: v20.x o superior
- **pnpm**: Gestor de paquetes (puede usar npm si lo prefiere)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd INTEGRATIONS-APIS

# Instalar dependencias
pnpm install
```

### Configuración

Crear un archivo `.env.local` (o `.env`) con las variables requeridas:

```env
# 🖥️ SERVIDOR
PORT=3001
NODE_ENV=development

# 🌐 CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# 🔗 API ADRES (Requerido)
ADRES_API_URL=https://aplicaciones.adres.gov.co/BDUA_Internet/Pages/ConsultarAfiliadoWeb_2.aspx

# 🔐 VARIABLES DE SEGURIDAD (Requeridas)
# Estos valores se extraen del formulario HTML de ADRES
RAD_SCRIPT_MANAGER=__VIEWSTATE
EVENT_TARGET=__EVENTARGUMENT
VIEW_STATE=__VIEWSTATE
VIEW_STATE_GENERATOR=__VIEWSTATEGENERATOR
EVENT_VALIDATION=__EVENTVALIDATION
```

### Ejecutar la Aplicación

```bash
# Desarrollo (con hot reload)
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod

# Modo debug
pnpm run start:debug
```

La aplicación estará disponible en:
- **API**: `http://localhost:3001/api/v1`
- **Documentación**: `http://localhost:3001/api/v1/docs`

---

## 📚 API Endpoints

### ADRES - Consulta de Afiliados

#### Buscar Afiliado
```
GET /api/v1/adres/consultar?tipoDoc=CC&numDoc=1234567890
```

**Parámetros Query:**
- `tipoDoc` (requerido): Tipo de documento (CC, TI, RC, CE, PA, NU, AS, MS, CD, CN, SC, PE, PT)
- `numDoc` (requerido): Número de documento

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "informacionBasica": {
      "tipoIdentificacion": "CC",
      "numeroIdentificacion": "1234567890",
      "nombres": "Juan",
      "apellidos": "Pérez García",
      "fechaNacimiento": "01/01/1980",
      "departamento": "Bogotá",
      "municipio": "Bogotá D.C."
    },
    "datosAfiliacion": [
      {
        "estado": "ACTIVO",
        "entidad": "Famisanar",
        "regimen": "CONTRIBUTIVO",
        "fechaAfiliacionEfectiva": "2020-01-15",
        "fechaFinalizacionAfiliacion": "",
        "tipoAfiliado": "Cotizante"
      }
    ]
  },
  "metadata": {
    "consultaUrl": "https://aplicaciones.adres.gov.co/BDUA_Internet/Pages/RespuestaConsulta.aspx?tokenId=...",
    "fechaProcesamiento": "2026-03-10T15:30:45.123Z"
  }
}
```

**Errores Posibles:**
- `400`: Parámetros inválidos o afiliado no encontrado
- `500`: Error al conectar con ADRES

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
pnpm run test

# Tests en modo watch
pnpm run test:watch

# Cobertura de tests
pnpm run test:cov

# Tests E2E
pnpm run test:e2e
```

---

## 🐳 Docker

### Compilar imagen
```bash
docker build -f Dockerfile.dev -t integrations-apis:dev .
```

### Ejecutar contenedor
```bash
docker run -p 3001:1141 \
  -e ADRES_API_URL=https://aplicaciones.adres.gov.co/BDUA_Internet/Pages/ConsultarAfiliadoWeb_2.aspx \
  -e RAD_SCRIPT_MANAGER=__VIEWSTATE \
  -e EVENT_TARGET=__EVENTARGUMENT \
  -e VIEW_STATE=__VIEWSTATE \
  -e VIEW_STATE_GENERATOR=__VIEWSTATEGENERATOR \
  -e EVENT_VALIDATION=__EVENTVALIDATION \
  integrations-apis:dev
```

---

## 📦 Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **NestJS** | ^11.0.1 | Framework backend |
| **TypeScript** | ^5.7.3 | Lenguaje |
| **Axios** | ^1.13.6 | Cliente HTTP |
| **Cheerio** | ^1.2.0 | Web scraping (parseo HTML) |
| **class-validator** | ^0.15.1 | Validación de DTOs |
| **class-transformer** | ^0.5.1 | Transformación de datos |
| **Swagger/OpenAPI** | ^11.2.6 | Documentación API |
| **Jest** | ^30.0.0 | Testing |

---

## 🔧 Scripts Disponibles

```bash
pnpm run build        # Compilar el proyecto
pnpm run start        # Iniciar aplicación
pnpm run start:dev    # Iniciar con hot reload (desarrollo)
pnpm run start:debug  # Iniciar en modo debug
pnpm run start:prod   # Iniciar en producción
pnpm run lint         # Ejecutar ESLint con fix automático
pnpm run format       # Formatear código con Prettier
pnpm run test         # Ejecutar tests
pnpm run test:watch   # Tests en modo watch
pnpm run test:cov     # Tests con cobertura
pnpm run test:e2e     # Tests E2E
```

---

## 🔐 Variables de Entorno Requeridas

Ver archivo `.env.example` para referencia completa.

**Críticas para ADRES:**
- `ADRES_API_URL`: URL base de la API de ADRES
- `RAD_SCRIPT_MANAGER`: Parámetro de seguridad del formulario
- `EVENT_TARGET`: Parámetro de seguridad del formulario
- `VIEW_STATE`: Parámetro de seguridad del formulario
- `VIEW_STATE_GENERATOR`: Parámetro de seguridad del formulario
- `EVENT_VALIDATION`: Parámetro de seguridad del formulario

---

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver LICENSE para más detalles.