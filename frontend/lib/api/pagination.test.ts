import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi } from './admin'
import { petsApi } from './pets'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('paginated QR and pet API requests', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests a filtered admin QR page and preserves pagination metadata', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      items: [],
      total: 61,
      page: 2,
      limit: 25,
    }))

    const result = await adminApi.getQRs(2, 25, 'Luna 1', 'assigned')
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)

    expect(requestedUrl.pathname).toBe('/api/v1/qr')
    expect(requestedUrl.searchParams.get('page')).toBe('2')
    expect(requestedUrl.searchParams.get('limit')).toBe('25')
    expect(requestedUrl.searchParams.get('search')).toBe('Luna 1')
    expect(requestedUrl.searchParams.get('assignment')).toBe('assigned')
    expect(result.total).toBe(61)
  })

  it('requests a searched user-pet page', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      items: [],
      total: 4,
      page: 3,
      limit: 20,
      pages: 1,
    }))

    await petsApi.getAll(3, 20, 'Luna')
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)

    expect(requestedUrl.pathname).toBe('/api/v1/pets')
    expect(requestedUrl.searchParams.get('page')).toBe('3')
    expect(requestedUrl.searchParams.get('limit')).toBe('20')
    expect(requestedUrl.searchParams.get('search')).toBe('Luna')
  })
})
