<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">API de Integraciones - Orquestador Multi-Proveedor</h1>

<p align="center">
  Una <strong>API escalable de APIs</strong> construida con <strong>NestJS</strong> que actúa como orquestador para consumir y unificar información de múltiples proveedores externos, específicamente <strong>ADRES</strong>, <strong>ASO-PAGOS (INTERSSI)</strong> y servicios de seguridad social colombianos.
</p>

---

## 🎯 Descripción

Esta es una API de propósito agregador que consume APIs externas de múltiples proveedores y expone la información de forma estructurada, validada y documentada. Utiliza una arquitectura escalable basada en **patrón Registry** que permite agregar nuevos proveedores sin modificar el core de la aplicación.

### Propósito Principal

- **Orquestador Multi-Proveedor**: Ejecuta múltiples proveedores en paralelo usando `Promise.allSettled`
- **Escalabilidad**: Patrón Registry agnóstico a cantidad de providers
- **Unificación de datos**: Normaliza y estructura respuestas de múltiples APIs externas
- **Web Scraping Avanzado**: Extrae información de APIs que requieren navegación complicada (ADRES)
- **CAPTCHA + OCR**: Automatización de lectura de CAPTCHAS con Tesseract.js y optimización de workers persistentes
- **Descarga de PDFs**: Descarga y parseado de certificados digitales
- **Manejo de sesiones**: Gestiona cookies, tokens y parámetros de seguridad automáticamente
- **Documentación automática**: Genera documentación interactiva con Swagger/OpenAPI

---

## 📋 Características Principales

### 1. 🏥 Integración ADRES

Consulta información de afiliados al sistema de salud colombiano:

- **Información Básica**: Identificación, nombres, apellidos, fecha de nacimiento, ubicación
- **Datos de Afiliación**: Estado, entidad (EPS), régimen, fechas de afiliación
- **Manejo de Sesiones**: Extrae automáticamente tokens y cookies del servidor ADRES
- **Web Scraping**: Parsea HTML usando Cheerio para extraer datos estructurados

### 2. 🔗 Integración ASO-PAGOS (INTERSSI)

Descarga certificados de pago y información de afiliación:

- **Sesión Persistente**: Manejo automático de cookies JSESSIONID
- **CAPTCHA OCR**: Lectura automática de CAPTCHAs con Tesseract.js
- **Descarga de PDFs**: Obtención de certificados digitales con validación
- **Parseado de PDFs**: Extracción de información estructurada de documentos
- **Reintentos Inteligentes**: Manejo automático de fallos con reintentos configurables

### 3. 📊 Integración SISBEN

Consulta datos de registro en el Sistema de Selección de Beneficiarios:

- **Información de Grupo SISBEN**: Clasificación socioeconómica y descripción
- **Datos Personales**: Información demográfica y ubicación
- **Metadata de Registro**: Ficha, fechas de actualización, encuesta vigente
- **Contacto Administrativo**: Información de oficina responsable

### 4. ⚙️ Orquestador Escalable

Arquitectura basada en patrón Registry:

- **Ejecución Paralela**: Todos los providers corren simultáneamente
- **Agnóstico a cantidad**: Agregue nuevos providers sin modificar core
- **Normalización uniforme**: Interface común para todos los providers
- **Normalización de Documentos**: Conversión centralizada de tipos de documento específicos por proveedor
- **Manejo de errores**: Fallos en un provider no afectan a otros

### 5. 🏗️ Arquitectura Modular

Estructura basada en dominios de NestJS:

- **Módulos independientes**: Cada integración es un módulo auto-contenido
- **Separación de responsabilidades**: Controllers, Services y DTOs claramente diferenciados
- **HTTP Client centralizado**: Gestión unificada de clientes HTTP con configuraciones específicas
- **Adapters HTTP**: Configuración específica por provider (headers, cookies, timeouts)
- **Document Type Mapper**: Centralización de conversión de tipos de documento entre formatos normalizados y específicos de cada proveedor

### 6. 🔒 Seguridad y Validación

- **DTOs con validación**: Todas las entradas se validan con class-validator
- **Variables de seguridad**: Manejo de parámetros sensibles desde variables de entorno
- **CORS configurado**: Control de orígenes permitidos
- **Tipado estricto**: TypeScript con strict: true
- **Persistencia de cookies**: Interceptores de Axios para mantener sesiones

### 7. 📚 Documentación API

- **Swagger/OpenAPI**: Documentación interactiva en `/api/v1/docs`
- **Esquemas detallados**: Ejemplos de request/response para cada endpoint
- **Manejo de errores**: Documentación de códigos de error (400, 500, etc.)

### 8. ⚡ Optimizaciones de Rendimiento

- **Tesseract.js Worker Persistente**: OCR pre-cargado en startup (60-80% más rápido)
- **OCR sin I/O de disco**: Procesamiento directo de buffers en memoria
- **Fallback inteligente**: Si el worker falla, usa OCR tradicional automáticamente
- **Tiempo de respuesta**: ~2 segundos para orquestación completa (vs 5 segundos original)

---

## 🔄 Cambios Recientes Implementados

### Normalización Centralizada de Tipos de Documento

**Problema**: Cada proveedor esperaba tipos de documento en formato diferente:
- ADRES/ASO-PAGOS: Strings normalizados (CC, TI, RC, CE, PA, etc.)
- SISBEN: Valores numéricos ('1', '2', '3', '4', etc.)

**Solución Implementada**:

1. **DocumentTypeMapper** (`src/common/mappers/document-type.mapper.ts`)
   - Centraliza conversión entre formatos
   - Métodos: `toAdresFormat()`, `toSisbenFormat()`, `toServiceFormat()`
   - Mapeos predefinidos: ADRES_DOCUMENT_TYPES, SISBEN_DOCUMENT_TYPES

2. **Orquestador Centralizado**
   - El `orchestrator.service.ts` realiza conversión ÚNICA antes de llamar providers
   - Previene doble conversión que causaba errores
   - Flujo: normalizado ("CC") → formato específico → proveedor

3. **Interfaces Provider Unificadas**
   - Todos los providers reciben `tipoDoc?: string | number` 
   - Ya convertido al formato específico por el orquestador
   - Sin lógica de conversión en servicios individuales

### Integración Completa de SISBEN

**Datos de SISBEN Ahora Incluidos**:

```typescript
// sisbenData incluido en respuesta final
sisbenData: {
  grupoSisben: string;           // Ej: "B5"
  grupoDescripcion: string;      // Ej: "Pobreza moderada"
  ficha: string;                 // Número de ficha
  fechaConsulta: string;         // Fecha de consulta
  encuestaVigente: string;       // Vigencia de encuesta
  ultimaActualizacionCiudadano: string;
  ultimaActualizacionRegistrosAdministrativos: string;
  oficina: {
    nombreAdministrador: string;
    direccion: string;
    telefono: string;
    correoElectronico: string;
  }
}
```

**DTOs Nuevos**:

- `SisbenDataDTO`: Información completa de SISBEN
- `SisbenOficinaDTO`: Datos de contacto administrativo
- Agregado a `CitizenDataDTO` y `ProviderContribution`

---

## 🏗️ Estructura del Proyecto

```
src/
├── app.module.ts                 # Módulo raíz con todos los imports
├── main.ts                       # Punto de entrada, configuración de Swagger
├── common/
│   ├── http/                     # Cliente HTTP centralizado
│   │   ├── http-client.service.ts
│   │   ├── http-client.config.ts
│   │   ├── adapters/
│   │   │   ├── http-client-adapter.interface.ts
│   │   │   └── default-http-client.adapter.ts
│   │   └── index.ts
│   ├── services/                 # Servicios compartidos
│   │   ├── file-storage.service.ts       # Guardado/lectura de archivos
│   │   ├── ocr.service.ts                # Tesseract.js con worker persistente
│   │   ├── pdf-parser.service.ts         # Extracción de texto de PDFs
│   │   ├── image-processor.service.ts    # Procesamiento de CAPTCHAs (sharp)
│   │   ├── services.module.ts            # Módulo exportador
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── provider.interface.ts         # Interface común para providers
│   │   └── http-client-adapter.interface.ts
│   ├── mappers/
│   │   └── document-type.mapper.ts       # Conversión centralizada de tipos de documento
│   ├── dto/
│   │   └── citizen-response.dto.ts       # DTO unificado de información ciudadano con SISBEN
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
│   ├── orchestrator/             # 🎯 Módulo orquestador central
│   │   ├── orchestrator.module.ts
│   │   ├── orchestrator.controller.ts
│   │   ├── orchestrator.service.ts    # Lógica de ejecución paralela
│   │   └── dto/
│   │       └── buscar-afiliado.dto.ts
│   ├── providers/
│   │   ├── adres/                # 🏥 Provider ADRES
│   │   │   ├── adres.module.ts
│   │   │   ├── adres.service.ts
│   │   │   ├── adapters/
│   │   │   │   └── adres-http-client.adapter.ts
│   │   │   ├── dto/
│   │   │   │   ├── buscar-afiliado.dto.ts
│   │   │   │   └── adres-response.dto.ts
│   │   │   └── index.ts
│   │   ├── aso-pagos/            # 🔗 Provider ASO-PAGOS
│   │   │   ├── aso-pagos.module.ts
│   │   │   ├── aso-pagos.service.ts
│   │   │   ├── adapters/
│   │   │   │   └── aso-pagos-http-client.adapter.ts
│   │   │   ├── dto/
│   │   │   │   ├── buscar-aso-pagos.dto.ts
│   │   │   │   └── aso-pagos-response.dto.ts
│   │   │   └── index.ts
│   │   ├── sisben/               # 📊 Provider SISBEN
│   │   │   ├── sisben.module.ts
│   │   │   ├── sisben.service.ts
│   │   │   ├── sisben.controller.ts
│   │   │   ├── adapters/
│   │   │   │   └── sisben-http-client.adapter.ts
│   │   │   ├── dto/
│   │   │   │   └── buscar-sisben.dto.ts
│   │   │   ├── interfaces/
│   │   │   │   └── sisben-consulta-result.interface.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── types/
│   └── afiliado.types.ts         # Tipos y enums compartidos
└── uploads/                      # Directorio para archivos temporales
    ├── *.png                     # CAPTCHAs procesados
    └── *.pdf                     # Certificados descargados
```

---

## 🚀 Instalación y Uso

### Requisitos Previos

- **Node.js**: v20.x o superior
- **pnpm**: Gestor de paquetes (puede usar npm si lo prefiere)
- **Docker**: (opcional, para ejecutar en contenedor)

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
PORT=3145
NODE_ENV=development

# 🌐 CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3145

# 🔗 APIs EXTERNAS
ADRES_API_URL=https://aplicaciones.adres.gov.co/BDUA_Internet/Pages/ConsultarAfiliadoWeb_2.aspx
ASO_PAGOS_API_URL=https://www.enlace-apb.com

# 🔐 VARIABLES DE SEGURIDAD ADRES
RAD_SCRIPT_MANAGER=__VIEWSTATE
EVENT_TARGET=__EVENTARGUMENT
VIEW_STATE=__VIEWSTATE
VIEW_STATE_GENERATOR=__VIEWSTATEGENERATOR
EVENT_VALIDATION=__EVENTVALIDATION

# 📁 ALMACENAMIENTO
UPLOADS_DIR=./uploads
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

- **API**: `http://localhost:3145/api/v1`
- **Documentación**: `http://localhost:3145/api/v1/docs`
- **Swagger JSON**: `http://localhost:3145/api/v1/docs-json`

---

## 📚 API Endpoints

### 🎯 Orquestador - Información Unificada

#### Obtener Información Completa del Ciudadano

```
GET /api/v1/citizen/:cedula
```

**Parámetros Path:**

- `cedula` (requerido): Número de cédula del ciudadano

**Query Parameters:**

- `tipoDoc` (opcional): Tipo de documento. Default: CC (CC, TI, RC, CE, PA, NU, AS, MS, CD, CN, SC, PE, PT)

**Response Exitoso (200):**

```json
{
  "meta": {
    "timestamp": "2026-05-15T18:39:30.645Z"
  },
  "data": {
    "persona": {
      "tipoIdentificacion": "CC",
      "numeroIdentificacion": "1032249209",
      "nombres": "JUAN CAMILO",
      "apellidos": "GUAPACHA LARGO",
      "fechaNacimiento": "**/**/**",
      "ubicacion": {
        "departamento": "RISARALDA",
        "municipio": "QUINCHIA"
      }
    },
    "afiliaciones": [
      {
        "fuente": "ADRES",
        "estado": "ACTIVO",
        "entidad": "ASMET SALUD EPS S.A.S. -CM",
        "regimen": "CONTRIBUTIVO",
        "fechaInicio": "12/11/2014",
        "fechaFin": "31/12/2999",
        "tipo": "COTIZANTE"
      }
    ],
    "aportante": {
      "fuente": "ASOPAGOS",
      "nit": "901837715",
      "empresa": "FINOVA",
      "periodos": {
        "pension": "2026-01",
        "salud": "2026-02"
      }
    },
    "sisbenData": {
      "grupoSisben": "B5",
      "grupoDescripcion": "Pobreza moderada",
      "ficha": "66594016512000000590",
      "fechaConsulta": "15/05/2026",
      "encuestaVigente": "25/09/2019",
      "ultimaActualizacionCiudadano": "31/08/2025",
      "ultimaActualizacionRegistrosAdministrativos": "28/02/2026",
      "oficina": {
        "nombreAdministrador": "SANDRA MILENA PEREZ VELEZ",
        "direccion": "Carrera 6 No 5 - 13",
        "telefono": "3563015 Extensión 120",
        "correoElectronico": "sisben@quinchia-risaralda.gov.co"
      }
    }
  },
  "providers": {
    "ADRES": {
      "status": "success"
    },
    "ASOPAGOS": {
      "status": "success"
    },
    "SISBEN": {
      "status": "success"
    }
  }
}
```

**Errores Posibles:**

- `400`: Parámetros inválidos
- `500`: Error al consultar proveedores
- `503`: Todos los proveedores fallaron

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

### Ejecutar con docker-compose

```bash
docker-compose -f docker-compose.dev.yml up
```

### Ejecutar contenedor directo

```bash
docker run -p 3145:3145 \
  -e ADRES_API_URL=https://aplicaciones.adres.gov.co/BDUA_Internet/Pages/ConsultarAfiliadoWeb_2.aspx \
  -e ASO_PAGOS_API_URL=https://www.enlace-apb.com \
  -v $(pwd)/uploads:/app/uploads \
  integrations-apis:dev
```

---

## 📦 Stack Tecnológico

| Tecnología            | Versión | Propósito                                 |
| --------------------- | ------- | ----------------------------------------- |
| **NestJS**            | ^11.0.1 | Framework backend                         |
| **TypeScript**        | ^5.7.3  | Lenguaje                                  |
| **Axios**             | ^1.13.6 | Cliente HTTP                              |
| **Cheerio**           | ^1.2.0  | Web scraping (parseo HTML)                |
| **Tesseract.js**      | ^7.0.0  | OCR para CAPTCHA (con worker persistente) |
| **Sharp**             | ^0.33.0 | Procesamiento de imágenes                 |
| **pdf-parse**         | ^2.4.5  | Extracción de texto de PDFs               |
| **class-validator**   | ^0.15.1 | Validación de DTOs                        |
| **class-transformer** | ^0.5.1  | Transformación de datos                   |
| **Swagger/OpenAPI**   | ^11.2.6 | Documentación API                         |
| **Jest**              | ^30.0.0 | Testing                                   |
| **Prettier**          | ^3.2.5  | Formateo de código                        |
| **ESLint**            | ^8.54.0 | Linting                                   |

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

## 🏗️ Arquitectura de Providers

### Patrón Registry

La aplicación utiliza el **patrón Registry** para gestionar providers:

1. Cada provider implementa la interface `Provider`
2. El orquestador registra providers dinámicamente
3. Ejecución paralela usando `Promise.allSettled`
4. Normalización uniforme de respuestas

### Normalización de Tipos de Documento

**DocumentTypeMapper** es el punto centralizado para conversión de tipos:

```
Cliente (envía: "CC")
         ↓
Orchestrator.executeProvider()
    ↓ (convierte con mapper)
DocumentTypeMapper.toServiceFormat("CC", "sisben")
    ↓ (retorna "3")
SISBEN.getData(numDoc, "3")
    ↓
Retorna con datos
```

**Mapeos Soportados**:
- ADRES: CC, TI, RC, CE, PA, SC, PE, PT
- SISBEN: '1'(RC), '2'(TI), '3'(CC), '4'(CE), '5'(DNI), '6'(PA), '7'(SC), '8'(PEP), '9'(PPT)
- ASO-PAGOS: Mismo que ADRES

Agregar nuevo mapeo en `document-type.mapper.ts` cuando sea necesario.

### Agregar Nuevo Provider

Para agregar un nuevo provider (ej: `nuevo-provider`):

1. **Crear módulo**: `src/core/providers/nuevo-provider/`

2. **Implementar interface Provider**:

```typescript
export class NuevoProviderService implements Provider {
  readonly name = 'nuevo-provider';
  readonly responseKey = 'NUEVO_PROVIDER';
  readonly timeout = 30000;

  async getData(numDoc: number, tipoDoc?: string | number): Promise<any> {
    // tipoDoc ya viene convertido al formato específico del proveedor
    // por el orchestrator (mediante DocumentTypeMapper)
    // Solo úsalo directamente
  }

  toContribution(data: unknown): ProviderContribution {
    // Normalización a formato unificado (persona, afiliaciones, aportante, etc.)
    return { persona: {...}, afiliaciones: [...] };
  }
}
```

3. **Si maneja tipos de documento diferentes**:
   - Agregar mapeo en `DocumentTypeMapper` (si no usa formato ADRES)
   - El orchestrator convertirá automáticamente

4. **Registrar en orquestador**: `orchestrator.service.ts`

5. **Eso es todo**: Sin cambios al core

---

## ⚡ Optimizaciones de Rendimiento

### Mejoras Implementadas

#### 1. Tesseract.js Worker Persistente

- **Antes**: ~1-1.5s por OCR (carga del worker cada vez)
- **Ahora**: ~0.1s por OCR (worker pre-cargado)
- **Mejora**: 80% reducción

#### 2. OCR Sin I/O de Disco

- **Antes**: Guardar CAPTCHA → OCR → Eliminar
- **Ahora**: OCR directo del buffer en memoria
- **Mejora**: Elimina latencia de escritura/lectura

#### 3. Ejecución Paralela

- ADRES y ASO-PAGOS corren simultáneamente
- **Tiempo total**: ~2 segundos (vs 5 segundos secuencial)

### Tiempo de Respuesta Actual

```
Total: ~2 segundos
├─ ADRES (paralelo): ~0.5s
└─ ASO-PAGOS (paralelo): ~1.5s
  ├─ CAPTCHA: 0.2s
  ├─ OCR (worker): 0.1s
  ├─ PDF Download: 3-4s (servidor)
  └─ PDF Parse: 0.5s
```

Ver `/PERFORMANCE_OPTIMIZATION_RESULTS.md` para detalles completos.

---

## 🔐 Seguridad

### Manejo de Sesiones

- **Cookies persistentes**: Almacenadas por Axios interceptor
- **JSESSIONID**: Reutilizado en múltiples requests
- **CSRF Protection**: Parámetros del formulario validados

### Validación de Datos

- DTOs con class-validator en todos los endpoints
- Tipado estricto de TypeScript
- Sanitización de inputs

### Variables Sensibles

- Nunca expuestas en logs
- Almacenadas en `.env` (excluido de git)
- Validadas en startup

---

## 📝 Documentación Adicional

- **[Arquitectura del Orquestador](/ORCHESTRATOR_ARCHITECTURE.md)**
- **[Flujo Completo INTERSSI](/INTERSSI_COMPLETE_FLOW.md)**
- **[Optimizaciones de Rendimiento](/PERFORMANCE_OPTIMIZATION_RESULTS.md)**
- **[Manejo de PDFs](/INTERSSI_PDF_VALIDATION.md)**
- **[Configuración de FormData](/INTERSSI_FORMDATA_FINAL.md)**

---

## 🤝 Contribución

Para contribuir nuevos providers o mejoras:

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nuevo-provider`)
3. Implementar siguiendo la arquitectura
4. Commit con mensajes claros
5. Push y crear Pull Request

---

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver LICENSE para más detalles.

---

## 📞 Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.
