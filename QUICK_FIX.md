# QUICK FIX: Resumen Ejecutivo

## Tu Problema
```
vercel deploy → Error: uv pip install asyncpg falla
Backend no sube a Vercel
```

## Causa Raíz
1. **asyncpg 0.29.0** necesita compilar en Vercel → falla sin `python3-dev`
2. **vercel.json mal configurado** → Vercel no sabe cómo compilar Python
3. **requirements.txt tiene duplicados** → Confunde a pip/uv

## Solución Rápida (3 pasos)

### Paso 1: Reemplazar requirements.txt
```bash
cp QR_PET_Backend/requirements-optimized.txt QR_PET_Backend/requirements.txt
```

**Por qué funciona**: 
- asyncpg 0.31.0 (vs 0.29.0) compila mejor
- Sin duplicados
- Versiones sincronizadas

### Paso 2: Actualizar QR_PET_Backend/vercel.json
```bash
cp QR_PET_Backend/vercel-optimized.json QR_PET_Backend/vercel.json
```

**Por qué funciona**:
- `installCommand: "pip"` (no `uv`) - más estable
- `PYTHON_VERSION: "3.11"` - explícito
- `maxLambdaSize: 50mb` - deja espacio para asyncpg

### Paso 3: Monorepo config en raíz (IMPORTANTE)
```bash
cp vercel-monorepo.json vercel.json
```

**Por qué funciona**:
- Define que es un monorepo
- Vercel sabe dónde está backend y frontend
- No intenta compilar frontend como Python

## Test Local Antes de Subir
```bash
cd QR_PET_Backend
pip install -r requirements.txt
python main.py
# Debe funcionar en http://localhost:8000
```

## Si Sigue Fallando

### Plan B: Cambiar a psycopg3 (sin compilación)
```bash
# En requirements.txt, reemplazar:
# psycopg2-binary==2.9.11  ← REMOVER
# Con:
psycopg[binary]==3.2.1
```

**Ventaja**: psycopg3 no necesita compilación. Deploy funciona garantizado.
**Desventaja**: Rendimiento ligeramente inferior (pero casi imperceptible).

## Archivos Creados para ti

| Archivo | Propósito |
|---------|-----------|
| `requirements-optimized.txt` | Versiones correctas, sin duplicados |
| `vercel-optimized.json` | Config backend corregida |
| `vercel-monorepo.json` | Config monorepo para raíz |
| `VERCEL_SETUP_GUIDE.md` | Guía detallada |
| `VERSION_COMPARISON.md` | Por qué cada versión |

## Siguiente: Deploy
```bash
git add .
git commit -m "fix: optimize vercel setup for monorepo deployment"
git push
vercel deploy
```

## Monitoreo en Vercel
```bash
# Ver logs en tiempo real
vercel logs --follow

# Si falla, revisar:
# 1. Environment variables (DATABASE_URL, etc)
# 2. Python version en Vercel settings
# 3. Build logs en Vercel dashboard
```

---

## Más Preguntas?
- `VERCEL_SETUP_GUIDE.md` - Explicación completa
- `VERSION_COMPARISON.md` - Por qué cada versión
- O pide ayuda específica sobre error exacto que ves
