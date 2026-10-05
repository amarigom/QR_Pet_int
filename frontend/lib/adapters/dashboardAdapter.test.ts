import { describe, expect, it } from 'vitest'
import { adaptDashboardResponse } from './dashboardAdapter'

const pet = {
  id: 'pet-1',
  nombre: 'Luna',
  especie: 'perro',
  estado: 'en_casa',
}

const scan = {
  id: 'scan-1',
  qr_codigo: 'QR-001',
  latitud: '-34.6',
  longitud: '-58.4',
  pet_name: 'Luna',
  created_at: '2026-10-03T12:00:00Z',
}

describe('adaptDashboardResponse', () => {
  it('adapta pets y recent_scans', () => {
    const result = adaptDashboardResponse({
      pets: [pet],
      pets_count: 1,
      recent_scans: [scan],
    })

    expect(result.pets).toHaveLength(1)
    expect(result.pets[0].nombre).toBe('Luna')
    expect(result.summary.total_pets).toBe(1)
    expect(result.recent_activity[0]).toMatchObject({
      id: 'scan-1',
      pet_name: 'Luna',
      latitud: -34.6,
      longitud: -58.4,
    })
  })

  it('adapta items y recent_activity al mismo formato', () => {
    const result = adaptDashboardResponse({
      items: [pet],
      pets_count: 1,
      recent_activity: [scan],
      veterinary_brands: [
        { nombre_clinica: 'Veterinaria Norte', logo_url: '/static/brands/norte.webp' },
        { nombre_clinica: 'Veterinaria Sur', logo_url: null },
      ],
    })

    expect(result.pets).toHaveLength(1)
    expect(result.pets[0].nombre).toBe('Luna')
    expect(result.summary.total_pets).toBe(1)
    expect(result.recent_activity[0].latitud).toBe(-34.6)
    expect(result.veterinary_brands).toEqual([
      { nombre_clinica: 'Veterinaria Norte', logo_url: '/static/brands/norte.webp' },
      { nombre_clinica: 'Veterinaria Sur', logo_url: null },
    ])
  })

  it('rechaza mascotas con campos obligatorios faltantes', () => {
    expect(() =>
      adaptDashboardResponse({
        pets: [{ id: 'pet-1' }],
      }),
    ).toThrow()
  })
})