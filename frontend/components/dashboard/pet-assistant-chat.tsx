'use client'

import { useState, type FormEvent } from 'react'
import { Bot, Loader2, MessageCircle, Send } from 'lucide-react'
import { knowledgeApi, type AssistantMessage, type AssistantSource } from '@/lib/api/knowledge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface PetAssistantChatProps {
  audience: 'usuario' | 'veterinario'
}

interface ChatEntry extends AssistantMessage {
  sources?: AssistantSource[]
}

function introduction(audience: PetAssistantChatProps['audience']): ChatEntry {
  return {
    role: 'assistant',
    content: audience === 'veterinario'
      ? 'Hola, soy el asistente de PetQR. Estoy disponible para ayudarte con el uso de la plataforma y consultar información vectorizada de tus pacientes vinculados e historias clínicas.'
      : '¡Hola! Soy el asistente de PetQR y estoy disponible para resolver tus dudas sobre la aplicación, cómo usarla y la información compartida por el equipo.',
  }
}

export function PetAssistantChat({ audience }: PetAssistantChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatEntry[]>([introduction(audience)])
  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const currentQuestion = question.trim()
    if (!currentQuestion || isSending) return

    const history: AssistantMessage[] = messages
      .slice(1)
      .map(({ role, content }) => ({ role, content }))
    const nextMessages: ChatEntry[] = [...messages, { role: 'user', content: currentQuestion }]
    setMessages(nextMessages)
    setQuestion('')
    setIsSending(true)
    try {
      const reply = await knowledgeApi.ask(
        currentQuestion,
        history,
      )
      setMessages([...nextMessages, {
        role: 'assistant',
        content: reply.respuesta,
        sources: reply.fuentes,
      }])
    } catch (error) {
      setMessages([...nextMessages, {
        role: 'assistant',
        content: error instanceof Error
          ? `No pude consultar el asistente: ${error.message}`
          : 'No pude consultar el asistente en este momento. Intentá nuevamente.',
      }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="fixed bottom-4 right-4 z-40 flex items-end gap-3">
        {!open && (
          <div className="max-w-56 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
            Estoy disponible para ayudarte con tus dudas.
          </div>
        )}
        <DialogTrigger asChild>
          <Button
            size="icon"
            aria-label="Abrir asistente PetQR"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="flex h-[min(680px,85vh)] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="border-b p-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Asistente PetQR
          </DialogTitle>
          <DialogDescription>
            {audience === 'veterinario'
              ? 'Información de la aplicación, tus pacientes vinculados e historias clínicas.'
              : 'Preguntame sobre la aplicación, sus funciones y la información compartida por tu veterinaria.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {messages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {!!message.sources?.length && (
                <p className="mt-2 border-t border-current/20 pt-1 text-xs opacity-75">
                  Fuentes: {message.sources.map((source) => source.titulo).join(', ')}
                </p>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando información...
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t p-3">
          <Textarea
            aria-label="Escribí tu pregunta"
            placeholder="Escribí tu pregunta..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={4000}
            rows={2}
            disabled={isSending}
            className="min-h-11 resize-none"
          />
          <Button type="submit" size="icon" aria-label="Enviar pregunta" disabled={isSending || !question.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
