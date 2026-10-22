import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { petsApi } from './pets'

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('pet veterinarian linking API', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('searches clinics by the provided name or registration code', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))

    await petsApi.searchVeterinarians('Vet Norte')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/pets\/veterinarias\/buscar\?q=Vet%20Norte$/),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('links and unlinks a veterinarian to one existing pet', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ message: 'Vínculo eliminado.' }))

    await petsApi.linkVeterinarian('pet-123', 'vet-456')
    await petsApi.unlinkVeterinarian('pet-123', 'vet-456')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/api\/v1\/pets\/pet-123\/veterinarias$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ veterinario_id: 'vet-456' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/api\/v1\/pets\/pet-123\/veterinarias\/vet-456$/),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
