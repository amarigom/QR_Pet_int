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

  it('requests a veterinarian action proposal without executing it', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      estado: 'propuesta',
      mensaje: 'Revisá los datos antes de guardar.',
      accion: {
        tipo: 'turno',
        mascota_nombre: 'Luna',
        datos: {
          mascota_id: 'pet-id',
          dueno_id: 'owner-id',
          fecha_hora_inicio: '2026-11-02T13:00:00Z',
          fecha_hora_fin: '2026-11-02T13:30:00Z',
          tipo_servicio: 'Vacunación',
        },
      },
    }))

    const result = await knowledgeApi.proposeAction('Agendá un turno para Luna', [])
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toMatch(/\/api\/v1\/conocimiento\/acciones\/proponer$/)
    expect(options.method).toBe('POST')
    expect(JSON.parse(String(options.body))).toMatchObject({
      pregunta: 'Agendá un turno para Luna',
      historial: [],
      continuar_accion: false,
    })
    expect(result.estado).toBe('propuesta')
  })

  it('continues a pending action when the user supplies missing details', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      estado: 'aclaracion',
      mensaje: 'Indicame la hora de fin.',
    }))

    await knowledgeApi.proposeAction(
      'de 12 a 13',
      [{ role: 'assistant', content: 'Indicame la hora de fin.' }],
      true,
    )
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(JSON.parse(String(options.body))).toMatchObject({
      pregunta: 'de 12 a 13',
      continuar_accion: true,
    })
  })

  it('sends an explicit confirmation only after the user approves a proposal', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      respuesta: 'Turno agendado.',
      fuentes: [],
    }))
    const action = {
      tipo: 'turno' as const,
      mascota_nombre: 'Luna',
      datos: {
        mascota_id: 'pet-id',
        dueno_id: 'owner-id',
        fecha_hora_inicio: '2026-11-02T13:00:00Z',
        fecha_hora_fin: '2026-11-02T13:30:00Z',
        tipo_servicio: 'Vacunación',
      },
    }

    await knowledgeApi.confirmAction(action)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toMatch(/\/api\/v1\/conocimiento\/acciones\/confirmar$/)
    expect(options.method).toBe('POST')
    expect(JSON.parse(String(options.body))).toEqual({ accion: action })
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
