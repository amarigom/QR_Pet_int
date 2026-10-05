import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { veterinarianApi } from './veterinarian'
import type { VeterinarianDashboardData } from '@/lib/types/veterinarian'

const clientId = '50000000-0000-4000-8000-000000000002'
const petId = '50000000-0000-4000-8000-000000000003'

const exampleDashboard: VeterinarianDashboardData = {
  clinic: {
    nombre_clinica: 'Veterinaria Ejemplo',
    logo_url: null,
  },
  clients: [{
    id: clientId,
    nombre: 'Ana Ejemplo',
    email: 'ana.ejemplo@example.test',
    telefono: '+5491100000000',
    mascotas_count: 1,
    pending_activation: false,
  }],
  available_clients: [{
    id: clientId,
    nombre: 'Ana Ejemplo',
    email: 'ana.ejemplo@example.test',
    telefono: '+5491100000000',
    mascotas_count: 1,
    pending_activation: false,
  }],
  pets: [{
    id: petId,
    usuario_id: clientId,
    nombre: 'Luna',
    especie: 'perro',
    estado: 'en_casa',
    qr: {
      id: '50000000-0000-4000-8000-000000000004',
      codigo: 'QR-DEMO-0001',
      activo: true,
      mascota_id: petId,
      created_at: '2026-10-03T12:00:00Z',
      lote: 'DEMO',
    },
  }],
  available_pets: [{
    id: petId,
    usuario_id: clientId,
    nombre: 'Luna',
    especie: 'perro',
    estado: 'en_casa',
    qr: null,
  }],
  qrs: [{
    id: '50000000-0000-4000-8000-000000000004',
    codigo: 'QR-DEMO-0001',
    activo: true,
    mascota_id: petId,
    mascota_nombre: 'Luna',
    dueno_nombre: 'Ana Ejemplo',
  }],
  scans: [{
    id: '50000000-0000-4000-8000-000000000005',
    qr_codigo: 'QR-DEMO-0001',
    pet_name: 'Luna',
    created_at: '2026-10-03T12:00:00Z',
    latitud: null,
    longitud: null,
    direccion_aproximada: null,
  }],
  medical_records: [{
    id: '50000000-0000-4000-8000-000000000006',
    veterinario_id: '50000000-0000-4000-8000-000000000001',
    mascota_id: petId,
    fecha_consulta: '2026-10-03T12:00:00Z',
    created_at: '2026-10-03T12:00:00Z',
    motivo_consulta: 'Control anual',
    diagnostico: 'Paciente en buen estado general.',
    tratamiento: 'Vacunación anual.',
    peso_kg: 12.4,
    temperatura_c: 38.5,
    adjuntos: [],
    vectorizada: true,
  }],
  appointments: [{
    id: '50000000-0000-4000-8000-000000000007',
    veterinario_id: '50000000-0000-4000-8000-000000000001',
    mascota_id: petId,
    dueno_id: clientId,
    fecha_hora_inicio: '2026-10-04T12:00:00Z',
    fecha_hora_fin: '2026-10-04T12:30:00Z',
    tipo_servicio: 'Control general',
    observaciones: 'Turno de ejemplo para pruebas.',
    estado: 'PROGRAMADO',
    recordatorio_enviado: false,
    created_at: '2026-10-03T12:00:00Z',
  }],
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('veterinarianApi', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lee el dashboard con el ejemplo de cliente, mascota, QR, escaneo, historia y turno', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(exampleDashboard))

    const result = await veterinarianApi.getDashboard()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/dashboard\/veterinario$/),
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result.clients[0].email).toBe('ana.ejemplo@example.test')
    expect(result.pets[0].qr?.codigo).toBe('QR-DEMO-0001')
    expect(result.medical_records[0].motivo_consulta).toBe('Control anual')
    expect(result.appointments[0].estado).toBe('PROGRAMADO')
  })

  it('crea un turno, registra una historia y actualiza el estado usando las rutas veterinarias', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(exampleDashboard.appointments[0], 201))
      .mockResolvedValueOnce(jsonResponse(exampleDashboard.medical_records[0], 201))
      .mockResolvedValueOnce(jsonResponse({
        ...exampleDashboard.appointments[0],
        estado: 'ATENDIDO',
      }))

    await veterinarianApi.createAppointment({
      mascota_id: petId,
      dueno_id: clientId,
      fecha_hora_inicio: '2026-10-04T12:00:00Z',
      fecha_hora_fin: '2026-10-04T12:30:00Z',
      tipo_servicio: 'Control general',
    })
    await veterinarianApi.createMedicalRecord({
      mascota_id: petId,
      motivo_consulta: 'Control anual',
      diagnostico: 'Paciente en buen estado general.',
      tratamiento: 'Vacunación anual.',
      peso_kg: 12.4,
      temperatura_c: 38.5,
    })
    const updated = await veterinarianApi.updateAppointmentStatus(
      exampleDashboard.appointments[0].id,
      'ATENDIDO',
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/api\/v1\/turnos\/$/),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/api\/v1\/historias-clinicas\/$/),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/\/api\/v1\/turnos\/50000000-0000-4000-8000-000000000007\/estado$/),
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(updated.estado).toBe('ATENDIDO')
  })

  it('consulta una semana y elimina el turno cancelándolo desde la API', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([exampleDashboard.appointments[0]]))
      .mockResolvedValueOnce(jsonResponse({
        ...exampleDashboard.appointments[0],
        estado: 'CANCELADO',
      }))

    const start = '2026-10-05T00:00:00.000Z'
    const end = '2026-10-12T00:00:00.000Z'
    const appointments = await veterinarianApi.getWeeklyAppointments(start, end)
    const deleted = await veterinarianApi.deleteAppointment(
      exampleDashboard.appointments[0].id,
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/api\/v1\/turnos\/agenda\/semanal\?inicio=2026-10-05T00%3A00%3A00\.000Z&fin=2026-10-12T00%3A00%3A00\.000Z$/),
      expect.objectContaining({ method: 'GET' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/api\/v1\/turnos\/50000000-0000-4000-8000-000000000007$/),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(appointments).toHaveLength(1)
    expect(deleted.estado).toBe('CANCELADO')
  })

  it('registra clientes vinculados y sube el logo como multipart', async () => {
    const createdClient = {
      id: clientId,
      nombre: 'Ana Ejemplo',
      email: 'ana.ejemplo@example.test',
      whatsapp_sent: true,
      activation_url: null,
      message: 'Activación enviada.',
    }
    const uploadedLogo = {
      id: '50000000-0000-4000-8000-000000000010',
      user_id: '50000000-0000-4000-8000-000000000001',
      nombre_clinica: 'Veterinaria Ejemplo',
      matricula: 'M-0001',
      especialidad: null,
      direccion_consultorio: null,
      telefono_agenda: null,
      logo_url: '/static/brands/logo.webp',
      activo: true,
      created_at: '2026-10-03T12:00:00Z',
    }
    fetchMock
      .mockResolvedValueOnce(jsonResponse(createdClient, 201))
      .mockResolvedValueOnce(jsonResponse(uploadedLogo))

    const client = await veterinarianApi.createClient({
      nombre: 'Ana Ejemplo',
      email: 'ana.ejemplo@example.test',
      telefono: '+5491100000000',
    })
    const logo = await veterinarianApi.uploadClinicLogo(
      new File(['logo'], 'logo.png', { type: 'image/png' }),
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/api\/v1\/veterinario\/clientes$/),
      expect.objectContaining({ method: 'POST' }),
    )
    const logoRequest = fetchMock.mock.calls[1][1] as RequestInit
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/v1\/veterinario\/perfil\/logo$/)
    expect(logoRequest.method).toBe('PUT')
    expect(logoRequest.body).toBeInstanceOf(FormData)
    expect(new Headers(logoRequest.headers).has('content-type')).toBe(false)
    expect(client.whatsapp_sent).toBe(true)
    expect(logo.logo_url).toBe('/static/brands/logo.webp')
  })

  it('allows retrying vectorization of pending clinical histories', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      procesadas: 4,
      vectorizadas: 3,
      pendientes: 1,
    }))

    const result = await veterinarianApi.vectorizePendingHistories()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/historias-clinicas\/vectorizar$/),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.pendientes).toBe(1)
  })

  it('solicita un nuevo enlace de activación para un cliente pendiente', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: clientId,
      nombre: 'Ana Ejemplo',
      email: 'ana.ejemplo@example.test',
      whatsapp_sent: false,
      activation_url: 'https://qr-pet.example/auth/activate?token=one-time',
      whatsapp_error: 'Template is not approved.',
      message: 'No se pudo enviar WhatsApp.',
    }))

    const result = await veterinarianApi.resendClientActivation(clientId)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`/api/v1/veterinario/clientes/${clientId}/reenviar-activacion$`)),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.activation_url).toContain('/auth/activate?token=')
    expect(result.whatsapp_error).toBe('Template is not approved.')
  })
})
