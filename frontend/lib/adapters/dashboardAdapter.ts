import type { AdminDashboardData, PetData, UserDashboardData } from '@/lib/types/dashboard'
import type { ScanWithLocation } from '@/lib/types/scan'
import { readPetCollection } from './petAdapter'

type ApiRecord = Record<string, unknown>

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(record: ApiRecord, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError(`La respuesta del dashboard no contiene un campo "${key}" válido.`)
  }
  return String(value)
}

function optionalString(record: ApiRecord, key: string): string | undefined {
  const value = record[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') {
    throw new TypeError(`El campo "${key}" del dashboard tiene un formato inválido.`)
  }
  return value
}

function isVeterinaryBrand(
  value: unknown,
): value is ApiRecord & { nombre_clinica: string; logo_url?: string | null } {
  return (
    isRecord(value) &&
    typeof value.nombre_clinica === 'string' &&
    (value.logo_url === null || value.logo_url === undefined || typeof value.logo_url === 'string')
  )
}

function adaptDashboardPet(record: ApiRecord): PetData {
  const rawQr = record.qr ?? record.qr_code
  let qr: PetData['qr'] = null

  if (rawQr !== undefined && rawQr !== null) {
    if (!isRecord(rawQr)) throw new TypeError('El código QR de una mascota tiene un formato inválido.')
    qr = {
      id: requiredString(rawQr, 'id'),
      codigo: requiredString(rawQr, 'codigo'),
      estado: optionalString(rawQr, 'estado') ?? (rawQr.activo === true ? 'activo' : 'inactivo'),
    }
  }

  return {
    id: requiredString(record, 'id'),
    nombre: requiredString(record, 'nombre'),
    especie: requiredString(record, 'especie'),
    estado: requiredString(record, 'estado'),
    foto_url: optionalString(record, 'foto_url'),
    raza: optionalString(record, 'raza'),
    color: optionalString(record, 'color'),
    edad_aproximada: optionalString(record, 'edad_aproximada'),
    notas: optionalString(record, 'notas'),
    qr,
  }
}

function adaptScan(record: ApiRecord): ScanWithLocation {
  const latitud = record.latitud
  const longitud = record.longitud
  const fecha = record.escaneado_en ?? record.created_at ?? record.fecha
  if (typeof fecha !== 'string') {
    throw new TypeError('La respuesta del dashboard no contiene una fecha de escaneo válida.')
  }
  const parseCoordinate = (coordinate: unknown): number | null => {
    if (coordinate === undefined || coordinate === null) return null
    const parsed = typeof coordinate === 'number' ? coordinate : Number(coordinate)
    if (!Number.isFinite(parsed)) {
      throw new TypeError('La respuesta del dashboard contiene una coordenada inválida.')
    }
    return parsed
  }

  return {
    id: requiredString(record, 'id'),
    qr_codigo: optionalString(record, 'qr_codigo') ?? '',
    latitud: parseCoordinate(latitud),
    longitud: parseCoordinate(longitud),
    pet_name: optionalString(record, 'pet_name') ?? optionalString(record, 'mascota_nombre') ?? 'Mascota',
    escaneado_en: fecha,
    direccion_aproximada: optionalString(record, 'direccion_aproximada'),
  }
}

function readScans(payload: unknown): ScanWithLocation[] {
  if (payload === undefined) return []
  if (!Array.isArray(payload) || !payload.every(isRecord)) {
    throw new TypeError('La respuesta del dashboard contiene una lista de escaneos inválida.')
  }
  return payload.map(adaptScan)
}

function numericValue(...values: unknown[]): number | undefined {
  const value = values.find((candidate) => typeof candidate === 'number' && Number.isFinite(candidate))
  return typeof value === 'number' ? value : undefined
}

function requiredNumber(record: ApiRecord, ...keys: string[]): number {
  const value = numericValue(...keys.map((key) => record[key]))
  if (value === undefined) {
    throw new TypeError(`La respuesta del dashboard no contiene una métrica válida (${keys.join(', ')}).`)
  }
  return value
}

export function adaptDashboardResponse(payload: unknown): UserDashboardData {
  if (!isRecord(payload)) {
    throw new TypeError('La respuesta del dashboard tiene un formato inválido.')
  }

  const pets = readPetCollection(payload).map(adaptDashboardPet)
  const rawSummary = isRecord(payload.summary) ? payload.summary : {}
  const qrCount = pets.filter((pet) => pet.qr !== null).length
  const summary = {
    total_pets: numericValue(rawSummary.total_pets, payload.pets_count) ?? pets.length,
    active_qrs: numericValue(rawSummary.active_qrs, payload.active_qrs, payload.qrs_count) ?? qrCount,
  }
  const recentActivity = readScans(payload.recent_activity ?? payload.recent_scans)
  const rawBrands = payload.veterinary_brands ?? []
  if (!Array.isArray(rawBrands) || !rawBrands.every(isVeterinaryBrand)) {
    throw new TypeError('La respuesta contiene una marca veterinaria inválida.')
  }

  return {
    role: 'user',
    summary,
    pets,
    recent_activity: recentActivity,
    veterinary_brands: rawBrands.map((brand) => ({
      nombre_clinica: brand.nombre_clinica,
      logo_url: optionalString(brand, 'logo_url') ?? null,
    })),
  }
}

function isDailyScan(value: unknown): value is { date: string; count: number } {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    typeof value.count === 'number' &&
    Number.isFinite(value.count)
  )
}

export function adaptAdminDashboardResponse(payload: unknown): AdminDashboardData {
  if (!isRecord(payload)) {
    throw new TypeError('La respuesta del dashboard de administración tiene un formato inválido.')
  }

  const rawScansByDay = payload.scans_by_day
  let scansByDay: AdminDashboardData['scans_by_day'] = []
  if (rawScansByDay !== undefined) {
    if (!Array.isArray(rawScansByDay) || !rawScansByDay.every(isDailyScan)) {
      throw new TypeError('La respuesta contiene una serie diaria de escaneos inválida.')
    }
    scansByDay = rawScansByDay.map(({ date, count }) => ({ date, count }))
  }

  return {
    users_count: requiredNumber(payload, 'users_count'),
    pets_count: requiredNumber(payload, 'pets_count'),
    qrs_count: requiredNumber(payload, 'qrs_count'),
    scans_count: requiredNumber(payload, 'scans_count', 'total_scans'),
    scans_by_day: scansByDay,
  }
}
