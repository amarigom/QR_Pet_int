import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { knowledgeApi } from './knowledge'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('knowledgeApi', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends assistant questions with the recent chat history', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      respuesta: 'Podés administrar tus mascotas desde Mis Mascotas.',
      fuentes: [{ doc_id: 'guide', titulo: 'Guía PetQR', categoria: 'general', tipo: 'document' }],
    }))

    const response = await knowledgeApi.ask('¿Cómo veo mis mascotas?', [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, estoy para ayudarte.' },
    ])
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toMatch(/\/api\/v1\/conocimiento\/responder$/)
    expect(options.method).toBe('POST')
    expect(JSON.parse(String(options.body))).toMatchObject({
      pregunta: '¿Cómo veo mis mascotas?',
      historial: [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Hola, estoy para ayudarte.' },
      ],
      limit: 5,
    })
    expect(response.fuentes[0].titulo).toBe('Guía PetQR')
  })

  it('uploads documents as multipart form data', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'document-id' })
    fetchMock.mockResolvedValueOnce(jsonResponse({
      status: 'success',
      message: 'Archivo vectorizado.',
      doc_id: 'document-id',
      chunks_procesados: 3,
    }))
    const file = new File(['contenido'], 'manual.pdf', { type: 'application/pdf' })

    await knowledgeApi.uploadFile(file, 'Manual de uso', 'uso')
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = options.body as FormData

    expect(url).toMatch(/\/api\/v1\/conocimiento\/archivo$/)
    expect(options.method).toBe('POST')
    expect(body.get('doc_id')).toBe('document-id')
    expect(body.get('titulo')).toBe('Manual de uso')
    expect(body.get('categoria')).toBe('uso')
    expect(body.get('file')).toBe(file)
  })
})
