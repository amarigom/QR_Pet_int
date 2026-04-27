# Índice de Documentación

## Documentos Principales

### 1. **RESUMEN_EJECUTIVO.md** ← COMIENZA AQUÍ
Descripción general del proyecto, mejoras realizadas y roadmap.

### 2. **REFACTORING_GUIDE.md**
Guía detallada de la refactorización, arquitectura y cambios.

### 3. **IMPROVEMENT_SUGGESTIONS.md**
12 mejoras específicas con código e implementación recomendada.

---

## Estructura del Código

```
app/
├── config.py                    # Configuración centralizada
├── middleware.py                # Middleware y CORS
│
├── core/                        # Módulo core
│   ├── auth.py                 # Autenticación JWT
│   ├── database.py             # Pool de conexiones
│   ├── exceptions.py           # Excepciones personalizadas
│   └── constants.py            # Constantes y enums
│
├── schemas/                     # Modelos Pydantic
│   ├── user.py
│   ├── pet.py
│   ├── qr.py
│   ├── scan.py
│   └── common.py
│
├── repositories/               # Acceso a datos (Pattern: Repository)
│   ├── base.py                 # Clase base CRUD genérica
│   ├── user_repository.py
│   ├── pet_repository.py
│   ├── qr_repository.py
│   └── scan_repository.py
│
├── services/                    # Lógica de negocio (Pattern: Service Layer)
│   ├── auth_service.py
│   ├── pet_service.py
│   ├── qr_service.py
│   ├── scan_service.py
│   └── admin_service.py
│
├── api/v1/                      # API versionada
│   ├── router.py               # Router principal
│   ├── dependencies.py         # Inyección de dependencias
│   └── endpoints/              # Endpoints por dominio
│       ├── auth.py
│       ├── pets.py
│       ├── qr.py
│       ├── scan.py
│       └── admin.py
│
└── utils/                       # Utilidades
    ├── logger.py               # Logging
    ├── validators.py           # Validadores personalizados
    └── helpers.py              # Funciones auxiliares

main.py                          # Aplicación principal (70 líneas)
```

---

## Cómo Usar Este Proyecto

### 1. Instalación Inicial
```bash
# Clonar proyecto
git clone <repo>
cd petfinder-backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configuración
```bash
# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
# - DATABASE_URL
# - JWT_SECRET
# - Etc.
```

### 3. Ejecutar
```bash
# Desarrollo (con reload automático)
uvicorn main:app --reload

# Producción
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4. Documentación Interactiva
```
http://localhost:8000/docs (Swagger UI)
http://localhost:8000/redoc (ReDoc)
```

---

## Patrones Arquitectónicos

### 1. **Repository Pattern**
Centraliza todas las queries SQL en clases repository separadas.

```python
# Antes
@app.get("/pets")
async def get_pets():
    p = await get_pool()
    pets = await p.fetch("SELECT...")

# Después
pet_repo = PetRepository()
pets = await pet_repo.get_by_user(user_id)
```

### 2. **Service Layer**
Lógica de negocio pura, separada de HTTP.

```python
# pets_service.py
async def create_pet(self, user_id, pet_data):
    # Validar datos
    # Crear mascota
    # Registrar auditoría
    # Retornar respuesta
```

### 3. **Dependency Injection**
FastAPI maneja automáticamente las dependencias.

```python
@router.get("/pets")
async def get_pets(user: dict = Depends(get_current_user)):
    # user es inyectado automáticamente
    return await pet_service.get_user_pets(user["id"])
```

### 4. **Versionamiento de API**
Preparado para múltiples versiones simultáneamente.

```
/api/v1/  ← Versión actual
/api/v2/  ← Versión futura
```

---

## Flujo de Datos

```
Request HTTP
    ↓
Router (api/v1/router.py)
    ↓
Endpoint (endpoints/xxx.py)
    ↓
Service (services/xxx_service.py)
    ↓
Repository (repositories/xxx_repository.py)
    ↓
Database (asyncpg)
    ↓
Response JSON
```

---

## Casos de Uso Implementados

### Autenticación
```python
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/me
```

### Mascotas
```python
POST /api/v1/pets                      # Crear
GET /api/v1/pets                       # Listar
GET /api/v1/pets/{id}                  # Detalle
PUT /api/v1/pets/{id}                  # Actualizar
DELETE /api/v1/pets/{id}               # Eliminar
```

### Códigos QR
```python
POST /api/v1/qr/generate               # Admin: generar
GET /api/v1/qr                         # Admin: listar
POST /api/v1/qr/activate               # Usuario: activar con mascota
GET /api/v1/qr/check/{code}            # Público: verificar disponibilidad
DELETE /api/v1/qr/{id}                 # Admin: eliminar
```

### Escaneos
```python
POST /api/v1/scans                     # Público: registrar escaneo
GET /api/v1/scans                      # Admin: listar todos
GET /api/v1/scans/pet/{pet_id}         # Usuario: escaneos de su mascota
```

### Administración
```python
GET /api/v1/admin/users                # Admin: listar usuarios
DELETE /api/v1/admin/users/{id}        # Admin: eliminar usuario
POST /api/v1/admin/users/{id}/toggle-admin  # Admin: cambiar rol
GET /api/v1/admin/stats                # Admin: estadísticas
```

---

## Mejores Prácticas Implementadas

✓ **Separación de capas**: Endpoints → Services → Repositories → DB
✓ **Validación de datos**: Pydantic schemas
✓ **Autenticación**: JWT con roles
✓ **Manejo de errores**: Excepciones personalizadas
✓ **Logging**: Sistema centralizado
✓ **CORS**: Configurado correctamente
✓ **Pool de BD**: Conexiones eficientes
✓ **Comentarios**: Código autodocumentado

---

## Pruebas

Actualmente sin tests. Ver `IMPROVEMENT_SUGGESTIONS.md` para implementar:

```bash
pip install pytest pytest-asyncio pytest-cov

# Ejecutar tests
pytest tests/ --cov

# Con salida detallada
pytest tests/ -v --cov=app
```

---

## Deployment

### En Vercel (Serverless)
```
pip freeze > requirements.txt
# Configura handler a main.app
```

### En Heroku
```bash
git push heroku main
# Configura vars de entorno
heroku config:set DATABASE_URL=...
```

### En Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

---

## Debugging

### Activa debug en .env
```
DEBUG=true
```

### Ve logs de la aplicación
```python
from app.utils.logger import logger
logger.info("Mensaje")
logger.error("Error")
```

---

## FAQs

**P: ¿Es compatible con mi cliente actual?**
R: Sí, totalmente. Las rutas están versionnadas en `/api/v1/`.

**P: ¿Puedo usar la BD antigua?**
R: Sí, todo funciona con el esquema existente.

**P: ¿Cómo agrego una nueva feature?**
R: 1. Crear schema en `schemas/`, 2. Crear repository, 3. Crear service, 4. Crear endpoint.

**P: ¿Dónde modifico queries SQL?**
R: En los repositories bajo `app/repositories/`.

**P: ¿Cómo manejo secretos?**
R: Usa variables de entorno, nunca hardcodees.

---

## Recursos

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/)

---

## Soporte

- Revisar `REFACTORING_GUIDE.md` para arquitectura
- Revisar `IMPROVEMENT_SUGGESTIONS.md` para mejoras
- Revisar código comentado en cada módulo
- Tests como documentación (cuando se implementen)

