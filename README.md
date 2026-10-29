# PetQR

PetQR es una aplicación web para identificar mascotas mediante códigos QR y conectar a sus dueños con quienes las encuentran. También ofrece herramientas para que las veterinarias gestionen clientes, turnos e historias clínicas.

El repositorio contiene un frontend en Next.js y una API en FastAPI, conectados a PostgreSQL. La interfaz está en español.

## Funcionalidades

### Para dueños

- Crear una cuenta y registrar mascotas con una medalla QR.
- Consultar y actualizar los datos de las mascotas.
- Vincular una mascota con una o más veterinarias y administrar esos vínculos.
- Reemplazar una medalla sin volver a crear la mascota ni perder su historial.
- Permitir que quien encuentre a la mascota consulte la información pública y contacte a su dueño.
- Consultar los escaneos registrados y su ubicación disponible.

### Para veterinarias

- Registrar clientes y enviarles un enlace de activación.
- Gestionar pacientes vinculados, turnos e identidad visual de la clínica.
- Acceder a la ficha clínica desde el QR cuando la mascota está relacionada con esa veterinaria.
- Crear, editar y consultar las historias clínicas propias, con paginación.
- Consultar la agenda semanal y recibir recordatorios por WhatsApp cuando estén configurados.
- Usar el asistente de IA para consultar documentación, agenda y pacientes dentro de los permisos de la clínica. Las propuestas de turnos e historias clínicas requieren confirmación antes de guardarse.

Cada veterinaria accede únicamente a las historias clínicas que registró. El vínculo de una mascota con una clínica puede originarse en una vinculación explícita del dueño, un turno o una historia clínica previa.

## Estructura del repositorio

```text
.
├── frontend/                 # Next.js, React, TypeScript y Tailwind CSS
│   ├── app/                  # Rutas, páginas y layouts
│   ├── components/           # Componentes de interfaz
│   └── lib/                  # Cliente API y lógica compartida
└── QR_PET_Backend/           # FastAPI, SQLAlchemy y Alembic
    ├── app/
    │   ├── api/v1/           # Endpoints versionados
    │   ├── models/           # Modelos de persistencia
    │   ├── repositories/     # Acceso a datos
    │   ├── schemas/          # Esquemas de API
    │   └── services/         # Reglas y servicios de negocio
    ├── alembic/              # Migraciones de base de datos
    └── tests/                # Pruebas del backend
```

La URL base de la API es `/api/v1`. La documentación interactiva de FastAPI está disponible en `/docs` y `/redoc` al ejecutar el backend.

## Requisitos

- Node.js y npm, compatibles con la versión de Next.js del proyecto.
- Python compatible con las dependencias de `QR_PET_Backend/requirements.txt`.
- PostgreSQL con la extensión `pgvector`.
- Una clave de Gemini para las funciones de IA y embeddings.
- Credenciales de WhatsApp Cloud API si se quieren habilitar mensajes y recordatorios.

## Configuración local

### 1. Backend

Desde la raíz del repositorio:

```powershell
cd QR_PET_Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

En Linux o macOS, activar el entorno con:

```bash
source .venv/bin/activate
```

Crear `QR_PET_Backend/.env` con los valores del entorno local:

```dotenv
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/petqr
JWT_SECRET=reemplazar-por-un-secreto-largo-y-aleatorio
FRONTEND_URL=http://localhost:3000
SMTP_USER=
SMTP_PASSWORD=
GEMINI_API_KEY=

# Opcionales: habilitan WhatsApp Cloud API y recordatorios.
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NAME=turno_recordatorio
WHATSAPP_ACTIVATION_TEMPLATE_NAME=activacion_cuenta
WHATSAPP_TEMPLATE_LANGUAGE=es_AR
WHATSAPP_API_VERSION=v22.0
REMINDER_TIMEZONE=America/Argentina/Buenos_Aires
```

No uses los valores de ejemplo en producción. `SMTP_USER` y `SMTP_PASSWORD` se usan para correo; las credenciales de WhatsApp son necesarias para los envíos de esa plataforma. Las funciones de IA requieren `GEMINI_API_KEY`.

Aplicar migraciones y arrancar la API:

```powershell
alembic upgrade head
uvicorn main:app --reload
```

La API queda disponible normalmente en `http://localhost:8000`; Swagger UI, en `http://localhost:8000/docs`.

### 2. Frontend

En otra terminal, desde la raíz:

```powershell
cd frontend
npm ci
```

Crear `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` indica el origen del backend. `APP_URL` se usa para formar metadatos absolutos, como la imagen Open Graph compartida en LinkedIn. En producción configurá ambas variables con las URLs públicas correctas; `APP_URL` debe ser una URL válida, por ejemplo `https://petqr.example.com`, sin formato Markdown.

Arrancar el frontend:

```powershell
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:3000` y la landing en `/es`.

## Pruebas y compilación

Frontend:

```powershell
cd frontend
npm test
npx tsc --noEmit
npm run build
```

Backend:

```powershell
cd QR_PET_Backend
python -m pytest
```

Las pruebas pueden necesitar una base de datos de test y variables de entorno válidas, según el módulo probado.

## Despliegue

- **Frontend:** compatible con Vercel. Configurar `NEXT_PUBLIC_API_URL` y `APP_URL` en las variables de entorno del proyecto y desplegar de nuevo después de cambiarlas. Para Open Graph, la ruta de la imagen es `/og-image.png` bajo `frontend/public/`.
- **Backend:** desplegar como servicio ASGI con `QR_PET_Backend` como directorio de trabajo. Configurar, como mínimo, la URL de PostgreSQL, un secreto JWT seguro y la URL pública del frontend. Aplicar `alembic upgrade head` durante el proceso de despliegue.
- **Base de datos:** mantener PostgreSQL y `pgvector` disponibles para la API; respaldar la base de datos y proteger sus credenciales.
- **WhatsApp e IA:** configurar sus credenciales solo si se habilitan esas integraciones. Para los recordatorios, también deben existir y estar aprobadas en Meta las plantillas correspondientes.

No almacenar secretos en el repositorio ni en variables públicas del frontend. Las variables `NEXT_PUBLIC_*` se incluyen en el código cliente y no deben contener credenciales privadas.

## Documentación adicional

- [Documentación del backend](./QR_PET_Backend/README.md): flujos y detalles de QR, acceso clínico, clientes, turnos, recordatorios y conocimiento vectorizado.
- [Documentación del proyecto](./QR_PET_Backend/DOCUMENTACION.md): índice de documentos técnicos disponibles en el backend.

## Estado y alcance

Los permisos de acceso a pacientes e historias clínicas se verifican en el backend. La interfaz no sustituye la validación de autorización del servidor. La disponibilidad de funcionalidades externas —WhatsApp, correo e IA— depende de sus credenciales y configuración.
