import { describe, expect, it } from 'vitest'
import { adaptPet, readPetCollection } from './petAdapter'

const pet = {
  id: 'pet-1',
  usuario_id: 'user-1',
  nombre: 'Luna',
  especie: 'perro',
  estado: 'en_casa',
  created_at: '2026-10-03T12:00:00Z',
  foto: 'https://example.com/luna.jpg',
  owner_name: 'Ana',
  owner_email: 'ana@example.com',
  qr: {
    id: 'qr-1',
    codigo: 'QR-001',
    activo: true,
  },
}

describe('petAdapter', () => {
  it('acepta una lista bajo la propiedad pets', () => {
    expect(readPetCollection({ pets: [pet] })).toEqual([pet])
  })

  it('acepta una lista paginada bajo la propiedad items', () => {
    expect(readPetCollection({ items: [pet], total: 1 })).toEqual([pet])
  })

  it('adapta los alias de foto, propietario y código QR', () => {
    const result = adaptPet(readPetCollection({ items: [pet] })[0])

    expect(result).toMatchObject({
      id: 'pet-1',
      nombre: 'Luna',
      foto_url: 'https://example.com/luna.jpg',
      owner_name: 'Ana',
      owner_email: 'ana@example.com',
      qr: {
        id: 'qr-1',
        codigo: 'QR-001',
        activo: true,
      },
    })
  })

  it('rechaza una respuesta que no contiene una lista de mascotas', () => {
    expect(() => readPetCollection({ results: [pet] })).toThrow(
      'La respuesta de mascotas no contiene una lista "pets" o "items".',
    )
  })
})
