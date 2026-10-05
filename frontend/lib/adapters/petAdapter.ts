import type { Pet } from '@/lib/types/pets'

type ApiRecord = Record<string, unknown>

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(record: ApiRecord, key: string, fallbackKey?: string): string {
  const value = record[key] ?? (fallbackKey ? record[fallbackKey] : undefined)
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`La respuesta de mascotas no contiene un campo "${key}" válido.`)
  }
  return value
}

function optionalString(record: ApiRecord, key: string, fallbackKey?: string): string | null | undefined {
  const value = record[key] ?? (fallbackKey ? record[fallbackKey] : undefined)
  if (value === undefined) return undefined
  if (value === null || typeof value === 'string') return value
  throw new TypeError(`El campo "${key}" de una mascota tiene un formato inválido.`)
}

function adaptOwner(value: unknown): Pet['owner'] {
  if (value === undefined || value === null) return undefined
  if (!isRecord(value)) {
    throw new TypeError('El responsable de una mascota tiene un formato inválido.')
  }
  const { id, nombre, email } = value
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof nombre !== 'string' ||
    typeof email !== 'string'
  ) {
    throw new TypeError('El responsable de una mascota no contiene datos válidos.')
  }

  return {
    id: String(id),
    nombre,
    email,
    rol: typeof value.rol === 'string' ? value.rol : undefined,
    created_at: typeof value.created_at === 'string' ? value.created_at : undefined,
    avatar_url: typeof value.avatar_url === 'string' ? value.avatar_url : null,
  }
}

function adaptQr(value: unknown): Pet['qr'] {
  if (value === undefined || value === null) return null
  if (!isRecord(value)) {
    throw new TypeError('El código QR de una mascota tiene un formato inválido.')
  }

  const id = value.id
  const codigo = value.codigo
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof codigo !== 'string') {
    throw new TypeError('El código QR de una mascota no contiene un identificador válido.')
  }

  return {
    id: String(id),
    codigo,
    mascota_id: typeof value.mascota_id === 'string' ? value.mascota_id : null,
    activo: typeof value.activo === 'boolean' ? value.activo : value.estado === 'activo',
    lote: typeof value.lote === 'string' ? value.lote : undefined,
  }
}

export function readPetCollection(payload: unknown): ApiRecord[] {
  let items: unknown
  if (Array.isArray(payload)) {
    items = payload
  } else if (isRecord(payload)) {
    items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.pets)
        ? payload.pets
        : undefined
  }

  if (!Array.isArray(items)) {
    throw new TypeError('La respuesta de mascotas no contiene una lista "pets" o "items".')
  }
  if (!items.every(isRecord)) {
    throw new TypeError('La respuesta contiene una mascota con un formato inválido.')
  }
  return items
}

export function adaptPet(record: ApiRecord): Pet {
  const owner = adaptOwner(record.owner ?? record.datos_dueño)
  const userId = record.usuario_id ?? record.user_id
  if (userId !== undefined && userId !== null && typeof userId !== 'string') {
    throw new TypeError('El identificador del propietario de una mascota tiene un formato inválido.')
  }

  return {
    id: requiredString(record, 'id'),
    usuario_id: typeof userId === 'string' ? userId : undefined,
    nombre: requiredString(record, 'nombre'),
    especie: requiredString(record, 'especie'),
    raza: optionalString(record, 'raza'),
    color: optionalString(record, 'color'),
    edad_aproximada: optionalString(record, 'edad_aproximada'),
    foto_url: optionalString(record, 'foto_url', 'foto'),
    notas: optionalString(record, 'notas'),
    estado: requiredString(record, 'estado'),
    created_at: requiredString(record, 'created_at'),
    updated_at: optionalString(record, 'updated_at') ?? undefined,
    owner,
    owner_name: optionalString(record, 'owner_name') ?? owner?.nombre,
    owner_email: optionalString(record, 'owner_email') ?? owner?.email,
    qr: adaptQr(record.qr ?? record.qr_code),
  }
}
