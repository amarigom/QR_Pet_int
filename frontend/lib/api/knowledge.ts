import { fetchAPI } from './client'

export interface KnowledgeDocument {
  doc_id: string
  titulo: string
  categoria: string
  source_type: string
  compartido: boolean
}

export interface KnowledgeIngestionResult {
  status: string
  message: string
  doc_id: string
  chunks_procesados: number
}

export interface AssistantSource {
  doc_id: string
  titulo: string
  categoria: string
  tipo: string
}

export interface AssistantReply {
  respuesta: string
  fuentes: AssistantSource[]
}

export type AssistantAction =
  | {
      tipo: 'turno'
      mascota_nombre: string
      datos: {
        mascota_id: string
        dueno_id?: string
        fecha_hora_inicio: string
        fecha_hora_fin: string
        tipo_servicio: string
        observaciones?: string | null
      }
    }
  | {
      tipo: 'historia_clinica_nueva'
      mascota_nombre: string
      datos: {
        mascota_id: string
        motivo_consulta: string
        diagnostico?: string | null
        tratamiento?: string | null
        peso_kg?: number | null
        temperatura_c?: number | null
      }
    }
  | {
      tipo: 'historia_clinica_actualizar'
      historia_id: string
      mascota_nombre: string
      fecha_consulta: string
      motivo_actual: string
      datos_actualizados: {
        motivo_consulta?: string | null
        diagnostico?: string | null
        tratamiento?: string | null
        peso_kg?: number | null
        temperatura_c?: number | null
      }
    }

export interface AssistantActionProposal {
  estado: 'sin_accion' | 'aclaracion' | 'propuesta'
  mensaje?: string | null
  accion?: AssistantAction | null
}

export interface AssistantActionConfirmation {
  respuesta: string
  fuentes: AssistantSource[]
  turno_id?: string | null
  fecha_hora_inicio?: string | null
}

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export const knowledgeApi = {
  listDocuments: () => fetchAPI<KnowledgeDocument[]>('/conocimiento/documentos'),

  uploadFile: (file: File, title: string, category: string) => {
    const formData = new FormData()
    formData.append('doc_id', crypto.randomUUID())
    formData.append('titulo', title)
    formData.append('categoria', category || 'general')
    formData.append('file', file)
    return fetchAPI<KnowledgeIngestionResult>('/conocimiento/archivo', {
      method: 'POST',
      body: formData,
    })
  },

  ask: (pregunta: string, historial: AssistantMessage[]) =>
    fetchAPI<AssistantReply>('/conocimiento/responder', {
      method: 'POST',
      body: JSON.stringify({ pregunta, historial, limit: 5 }),
    }),

  proposeAction: (
    pregunta: string,
    historial: AssistantMessage[],
    continuarAccion = false,
  ) =>
    fetchAPI<AssistantActionProposal>('/conocimiento/acciones/proponer', {
      method: 'POST',
      body: JSON.stringify({
        pregunta,
        historial,
        limit: 5,
        continuar_accion: continuarAccion,
      }),
    }),

  confirmAction: (accion: AssistantAction) =>
    fetchAPI<AssistantActionConfirmation>('/conocimiento/acciones/confirmar', {
      method: 'POST',
      body: JSON.stringify({ accion }),
    }),
}
