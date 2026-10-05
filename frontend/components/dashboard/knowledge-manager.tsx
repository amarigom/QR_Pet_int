'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BookOpen, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { knowledgeApi, type KnowledgeDocument } from '@/lib/api/knowledge'
import { veterinarianApi } from '@/lib/api/veterinarian'

interface KnowledgeManagerProps {
  audience: 'admin' | 'veterinarian'
  vectorizeMedicalHistories?: boolean
}

export function KnowledgeManager({
  audience,
  vectorizeMedicalHistories = false,
}: KnowledgeManagerProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isVectorizing, setIsVectorizing] = useState(false)

  const reloadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      setDocuments(await knowledgeApi.listDocuments())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el conocimiento.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadDocuments()
  }, [reloadDocuments])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const file = values.get('knowledge-file')
    const title = String(values.get('knowledge-title') || '').trim()
    const category = String(values.get('knowledge-category') || '').trim() || 'general'

    if (!(file instanceof File) || file.size === 0) {
      toast.error('Seleccioná un archivo PDF o Word (.docx).')
      return
    }
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      toast.error('El formato permitido es PDF, Word (.docx) o TXT.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 10 MB.')
      return
    }
    if (!title) {
      toast.error('Ingresá un título para el documento.')
      return
    }

    setIsUploading(true)
    try {
      const result = await knowledgeApi.uploadFile(file, title, category)
      toast.success(`${result.message} (${result.chunks_procesados} fragmentos).`)
      form.reset()
      await reloadDocuments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo vectorizar el archivo.')
    } finally {
      setIsUploading(false)
    }
  }

  async function vectorizeHistories() {
    setIsVectorizing(true)
    try {
      const result = await veterinarianApi.vectorizePendingHistories()
      if (result.pendientes > 0) {
        toast.warning(
          `Se vectorizaron ${result.vectorizadas} de ${result.procesadas} historias; quedan ${result.pendientes} pendientes.`,
        )
      } else {
        toast.success(`${result.vectorizadas} historias clínicas vectorizadas.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron vectorizar las historias.')
    } finally {
      setIsVectorizing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {audience === 'admin' ? 'Conocimiento de PetQR' : 'Conocimiento de la veterinaria'}
          </CardTitle>
          <CardDescription>
            {audience === 'admin'
              ? 'Cargá guías de uso y documentos generales. El asistente los compartirá con usuarios y veterinarios.'
              : 'Cargá protocolos y documentos clínicos propios. Solo vos podrás consultarlos junto con tus pacientes vinculados.'}
            {' '}Los archivos se extraen, dividen en fragmentos y guardan vectorizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="knowledge-title">Título</Label>
              <Input id="knowledge-title" name="knowledge-title" required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge-category">Categoría</Label>
              <Input id="knowledge-category" name="knowledge-category" placeholder="general" maxLength={100} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knowledge-file">Archivo PDF, Word (.docx) o TXT (máx. 10 MB)</Label>
              <Input
                id="knowledge-file"
                name="knowledge-file"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                required
              />
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Vectorizar archivo
              </Button>
              {vectorizeMedicalHistories && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isVectorizing}
                  onClick={() => void vectorizeHistories()}
                >
                  {isVectorizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vectorizar historias clínicas pendientes
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos disponibles</CardTitle>
          <CardDescription>
            {audience === 'veterinarian'
              ? 'Incluye documentos compartidos por administración y los cargados por tu veterinaria.'
              : 'Documentos que el asistente utiliza para responder.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando documentos...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay documentos vectorizados.</p>
          ) : (
            <ul className="divide-y">
              {documents.map((document) => (
                <li key={document.doc_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{document.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {document.categoria} · {document.source_type === 'medical_record' ? 'Historia clínica' : 'Documento'}
                    </p>
                  </div>
                  {audience === 'veterinarian' && document.compartido && (
                    <span className="text-xs text-muted-foreground">Compartido por PetQR</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
