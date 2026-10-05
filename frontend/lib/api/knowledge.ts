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
}
