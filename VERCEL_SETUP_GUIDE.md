# Análisis de Problemas: Vercel Monorepo QR_Pet

## PROBLEMAS IDENTIFICADOS

### 1. **requirements.txt - Versiones Conflictivas**

#### Problemas:
- **asyncpg 0.29.0**: Requiere compilación de extensiones C. En Vercel con `uv`, puede fallar por falta de dev tools.
- **psycopg2-binary 2.9.11**: Versión desactualizada (2024), mejor usar la última o considerar psycopg3.
- **Duplicados**: `python-jose[cryptography]` y `cryptography` están listados dos veces.
- **Versiones antiguas**: FastAPI 0.110.0 es de Feb 2024. Vercel usa Python 3.11/3.12, mejor actualizar.

#### Dependencias problemáticas:
```
asyncpg==0.29.0          # ← CAUSA PROBLEMAS con uv pip install
psycopg2-binary==2.9.11  # ← Versión vieja
```

---

### 2. **vercel.json (Backend) - Configuración Incompleta**

#### Problema actual:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [...]
}
```

#### Problemas:
- **No especifica Python runtime**: Vercel no sabe qué versión de Python usar.
- **No optimizado para monorepo**: Debería apuntar a `QR_PET_Backend/main.py`.
- **No configura `uv` explícitamente**: Vercel puede no usar `uv` por defecto.
- **Rutas insuficientes**: Falta manejo de archivos estáticos y errores 404.

---

### 3. **vercel.json (Frontend) - Rewrite URL Fallida**

#### Problema:
```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://tu-backend-api.com/api/:path*"  // ← PLACEHOLDER
  }
]
```

#### Problemas:
- La URL es un placeholder que no apunta a nada real.
- Si el backend está en un dominio diferente, el CORS fallará sin configuración correcta.

---

## SOLUCIONES RECOMENDADAS

### Solución 1: Limpiar y Optimizar requirements.txt

#### Versiones RECOMENDADAS (compatibles con Vercel + uv):

```txt
# FastAPI & Uvicorn
fastapi==0.112.0          # ← Latest stable (2024)
uvicorn[standard]==0.30.0 # ← With C extensions

# Database - PostgreSQL
# Opción A (Recomendado): asyncpg con versión estable
asyncpg==0.31.0           # ← Latest que funciona bien con uv

# SQLAlchemy
SQLAlchemy==2.0.36        # ← Stable, compatible con asyncpg

# Pydantic (Validation)
pydantic==2.9.2           # ← Latest
pydantic-settings==2.4.0
pydantic_core==2.28.1

# Auth & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.1.3
cryptography==43.0.1
PyJWT>=2.8.0

# Utils
python-dotenv==1.0.1
python-multipart==0.0.9
email-validator==2.2.0
annotated-types==0.7.0
typing_extensions==4.12.2
idna==3.11
greenlet==3.1.1           # ← Necesario para SQLAlchemy con async
```

#### Por qué estos cambios:
- **asyncpg 0.31.0**: Versión más reciente que compila bien en Vercel.
- **FastAPI 0.112.0**: Últimas optimizaciones y fixes de seguridad.
- **Uvicorn con [standard]**: Incluye todas las extensiones necesarias.
- **Sin duplicados**: Cada paquete aparece una sola vez.

---

### Solución 2: Configurar vercel.json para Backend (En QR_PET_Backend/)

#### Archivo correcto:

```json
{
  "version": 2,
  "installCommand": "pip install -r requirements.txt",
  "buildCommand": "echo 'FastAPI auto-builds'",
  "outputDirectory": ".",
  "env": {
    "PYTHON_VERSION": "3.11"
  },
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python@3.9.13",
      "config": {
        "maxLambdaSize": "50mb",
        "runtime": "python3.11"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py",
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
  ]
}
```

#### Cambios clave:
- `installCommand`: Especifica usar `pip` (más estable que `uv` en Vercel).
- `PYTHON_VERSION`: Declara qué versión usar.
- `maxLambdaSize`: Aumenta límite para dependencias grandes.
- `methods`: Incluye todos los métodos HTTP que FastAPI necesita.

---

### Solución 3: Configurar vercel.json en Raíz (Monorepo)

#### Archivo en raíz del monorepo:

```json
{
  "version": 2,
  "projects": [
    {
      "name": "qr-pet-backend",
      "path": "QR_PET_Backend",
      "installCommand": "pip install -r requirements.txt",
      "buildCommand": "echo 'Backend ready'",
      "outputDirectory": "."
    },
    {
      "name": "qr-pet-frontend",
      "path": "frontend",
      "framework": "nextjs"
    }
  ]
}
```

---

### Solución 4: Frontend vercel.json - Actualizar URL Backend

```json
{
  "framework": "nextjs",
  "rootDirectory": "frontend",
  "cleanUrls": true,
  "env": [
    "NEXT_PUBLIC_API_BASE_URL"
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "${NEXT_PUBLIC_API_BASE_URL}/api/:path*"
    }
  ]
}
```

Luego en variables de Vercel frontend, agregar:
```
NEXT_PUBLIC_API_BASE_URL = https://tu-backend-url.vercel.app
```

---

## ALTERNATIVA: Manejar asyncpg en Vercel

Si `asyncpg` sigue fallando con compilación:

### Opción A: Usar psycopg3 (recomendado - sin compilación)
```txt
# Reemplazar esto:
psycopg2-binary==2.9.11

# Con esto:
psycopg[binary]==3.2.1
```

Y actualizar código si es necesario (psycopg3 tiene API ligeramente diferente).

### Opción B: Pre-compilar ruedas localmente
```bash
# Construir rueda de asyncpg localmente
pip wheel asyncpg==0.31.0

# Subir el .whl a Vercel (en .vercel/pip_cache)
```

---

## PASOS A SEGUIR

### 1. Reemplazar requirements.txt
```bash
# Copiar las versiones recomendadas
```

### 2. Actualizar QR_PET_Backend/vercel.json
```bash
# Usar la configuración de Solución 2
```

### 3. Crear o actualizar vercel.json en raíz
```bash
# Usar la configuración de Solución 3
```

### 4. Testing local
```bash
cd QR_PET_Backend
pip install -r requirements.txt
python main.py
# Verificar en http://localhost:8000
```

### 5. Verificar health check
```bash
curl http://localhost:8000/health
# Debe retornar {"status": "ok", "db": "connected"}
```

---

## DEBUGGING SI FALLA

1. **Verificar logs de Vercel:**
   ```bash
   vercel logs --follow
   ```

2. **Si asyncpg falla en compilación:**
   - Cambiar a psycopg3
   - O revisar si falta `python3-dev` en Vercel

3. **Si DATABASE_URL no se encuentra:**
   - Agregar en Vercel Project Settings > Environment Variables

4. **Si importación falla:**
   - Verificar que `import asyncpg` esté en el código
   - O que no haya conflictos con otros drivers

---

## CHECKLIST FINAL

- [ ] requirements.txt actualizado y sin duplicados
- [ ] QR_PET_Backend/vercel.json configurado con runtime
- [ ] vercel.json en raíz define el monorepo
- [ ] frontend/vercel.json apunta a URL real del backend
- [ ] Environment variables en Vercel configuradas
- [ ] Local testing funciona sin errores
- [ ] Deploy a Vercel exitoso
