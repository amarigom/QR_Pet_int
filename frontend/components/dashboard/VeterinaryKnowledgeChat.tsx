'use client'

import { FormEvent, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { dashboardApi, ChatSource } from '@/lib/api/dashboard'

export function VeterinaryKnowledgeChat() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<ChatSource[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = question.trim()
    if (!value || loading) return
    setLoading(true)
    try {
      const result = await dashboardApi.chat(value)
      setAnswer(result.respuesta)
      setSources(result.fuentes || [])
      setQuestion('')
    } catch {
      setAnswer('No pude consultar la base de conocimiento. Intenta nuevamente.')
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <MessageCircle className="h-5 w-5 text-primary" />
        <CardTitle className="text-base">Asistente clínico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Consulta la base de conocimiento y los registros vectorizados de mascotas.
        </p>
        {answer && <div className="rounded-md bg-muted/50 p-3 text-sm leading-6">{answer}</div>}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {sources.map((source) => <span key={source.doc_id} className="rounded bg-muted px-2 py-1">{source.titulo}</span>)}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pregunta sobre una mascota o procedimiento" aria-label="Pregunta al asistente" />
          <Button type="submit" disabled={loading || !question.trim()} aria-label="Enviar pregunta"><Send className="h-4 w-4" /></Button>
        </form>
      </CardContent>
    </Card>
  )
}
