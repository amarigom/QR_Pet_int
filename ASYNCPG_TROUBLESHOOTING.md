# Troubleshooting: Si asyncpg Sigue Fallando en Vercel

## Error Común #1: "fatal error: pg_config.h: No such file or directory"

### Síntoma
```
error: command 'gcc' failed with exit status 1
fatal error: pg_config.h: No such file or directory
```

### Causa
Vercel no tiene PostgreSQL dev libraries instaladas.

### Soluciones (en orden)

#### Solución 1A: Usar installCommand con pre-requisitos
```json
{
  "installCommand": "apt-get update && apt-get install -y libpq-dev && pip install -r requirements.txt"
}
```

❌ **NO FUNCIONA**: Vercel usa contenedores read-only, no puedes instalar packages.

#### Solución 1B: Pre-compilar asyncpg (avanzado)
1. En tu máquina local:
```bash
pip wheel asyncpg==0.31.0 -w ./wheels/
```

2. Subir `.whl` a tu repo:
```bash
git add wheels/asyncpg-0.31.0-*.whl
```

3. En vercel.json:
```json
{
  "installCommand": "pip install --no-index --find-links ./wheels/ -r requirements.txt"
}
```

✅ **FUNCIONA** pero es complejo.

#### Solución 1C: CAMBIAR A PSYCOPG3 (RECOMENDADO)
```txt
# En requirements.txt
psycopg[binary]==3.2.1
```

✅ **FUNCIONA SIEMPRE**: Psycopg3 viene pre-compilado con binarios.

---

## Error Común #2: "ModuleNotFoundError: No module named 'asyncpg'"

### Síntoma
```
ModuleNotFoundError: No module named 'asyncpg'
Vercel build passed, pero en runtime falla
```

### Causa
1. asyncpg no se instaló durante build (silenciosamente ignorado)
2. O se instaló en Python 3.10 pero runtime es 3.11

### Soluciones

#### Solución 2A: Especificar Python version explícitamente
```json
{
  "env": {
    "PYTHON_VERSION": "3.11"
  },
  "builds": [
    {
      "config": {
        "runtime": "python3.11"
      }
    }
  ]
}
```

#### Solución 2B: Usar pre-built wheels de asyncpg
```bash
# Descargar wheel pre-compilado para Python 3.11
pip download asyncpg==0.31.0 --python-version 311 --only-binary=:all:

# Subir al repo
git add wheels/asyncpg-0.31.0-cp311-*.whl
```

#### Solución 2C: CAMBIAR A PSYCOPG3
```txt
psycopg[binary]==3.2.1
```

✅ **Garantizado**: Los binarios de psycopg3 son muy estables.

---

## Error Común #3: "uv pip install: command not found"

### Síntoma
```
error: uv not found
Failed to install dependencies
```

### Causa
Vercel está intentando usar `uv` pero no está disponible.

### Soluciones

#### Solución 3A: Cambiar a pip (RECOMENDADO)
```json
{
  "installCommand": "pip install -r requirements.txt"
}
```

✅ **FUNCIONA SIEMPRE**: pip es el estándar de Vercel.

#### Solución 3B: Usar uv explícitamente
```json
{
  "buildCommand": "uv pip install -r requirements.txt"
}
```

❌ **NO RECOMENDADO**: uv es experimental en Vercel.

---

## Decisión Final: Qué Hacer

### Matriz de Decisión

| Error | Opción A | Opción B (Fácil) | Opción C (Rápida) |
|-------|----------|------------------|-------------------|
| pg_config.h | Pre-compilar | Psycopg3 ✅ | Local testing |
| ModuleNotFoundError | Wheels | Psycopg3 ✅ | Especificar Python |
| uv not found | uv --version | Cambiar a pip ✅ | Nada, automático |

**Recomendación Unificada**: Cambiar a **psycopg3**

### Por Qué psycopg3 es la Mejor Opción

```txt
ASYNCPG vs PSYCOPG3
╔════════════════╦═════════════╦═════════════╗
║ Criterio       ║ asyncpg     ║ psycopg3    ║
╠════════════════╬═════════════╬═════════════╣
║ Compilación    ║ ❌ Sí       ║ ✅ No       ║
║ Pre-compilado  ║ ❌ Casi no  ║ ✅ Sí       ║
║ Vercel Deploy  ║ ⚠️ Problemas║ ✅ Perfecto ║
║ Performance    ║ ✅ Mejor    ║ ✅ Bueno    ║
║ API            ║ ✅ Moderna  ║ ✅ SQL      ║
║ Documentación  ║ ✅ Excelente║ ✅ Completa ║
╚════════════════╩═════════════╩═════════════╝
```

### Implementar Psycopg3

**Paso 1**: Actualizar requirements.txt
```txt
# Remover:
psycopg2-binary==2.9.11

# Agregar:
psycopg[binary]==3.2.1
```

**Paso 2**: No cambiar código (si usas SQLAlchemy)
- SQLAlchemy detecta automáticamente psycopg3
- La API es compatible

**Paso 3**: Test local
```bash
pip install psycopg[binary]==3.2.1
python -c "import psycopg; print(psycopg.__version__)"
```

**Paso 4**: Deploy
```bash
git add -A
git commit -m "chore: switch to psycopg3 for Vercel compatibility"
git push
vercel deploy
```

---

## Si Quieres Mantener asyncpg

### Plan Step-by-Step

1. **Asegurar pip (no uv)**
```json
"installCommand": "pip install -r requirements.txt"
```

2. **Aumentar memoria/timeout**
```json
"config": {
  "maxLambdaSize": "100mb",
  "timeout": 300
}
```

3. **Usar wheel pre-compilado**
```bash
# Local
pip wheel asyncpg==0.31.0 -w ./wheels/
git add wheels/

# vercel.json
"installCommand": "pip install --no-index --find-links ./wheels/ asyncpg==0.31.0"
```

4. **Test agresivo local**
```bash
python -c "import asyncpg; asyncio.run(test())"
```

---

## Checklist de Debugging

Cuando falla el deploy:

- [ ] Ver logs completos en Vercel dashboard
- [ ] Verificar que Python version es 3.11
- [ ] Verificar que installCommand es `pip` (no `uv`)
- [ ] Revisar requirements.txt busca líneas duplicadas
- [ ] Confirmar DATABASE_URL en env vars
- [ ] Test local: `pip install -r requirements.txt && python main.py`
- [ ] Si asyncpg falla: cambiar a psycopg3

---

## Última Opción: Serverless Database

Si PostgreSQL en Vercel causa problemas, considera:

```python
# SQLite para desarrollo/testing
# DATABASE_URL = "sqlite:///./test.db"

# Neon PostgreSQL (serverless, sin compilación)
# DATABASE_URL = "postgresql://user:password@db.neon.tech/..."
```

Neon proporciona binarios pre-compilados y conexiones sin problemas.
