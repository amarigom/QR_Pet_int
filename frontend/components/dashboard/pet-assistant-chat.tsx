'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Check, Loader2, MessageCircle, Mic, Send, Square, X } from 'lucide-react'
import {
  knowledgeApi,
  type AssistantAction,
  type AssistantMessage,
  type AssistantSource,
} from '@/lib/api/knowledge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface PetAssistantChatProps {
  audience: 'admin' | 'usuario' | 'veterinario'
}

interface ChatEntry extends AssistantMessage {
  sources?: AssistantSource[]
  action?: AssistantAction
  actionStatus?: 'pending' | 'confirmed' | 'cancelled'
}

interface SpeechResultLike {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: { readonly transcript: string }
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechResultLike[]
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognitionConstructor() {
  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
}

function introduction(audience: PetAssistantChatProps['audience']): ChatEntry {
  return {
    role: 'assistant',
    content: audience === 'veterinario'
      ? 'Hola, soy el asistente de PetQR. Estoy disponible para ayudarte con el uso de la plataforma y consultar información vectorizada de tus pacientes vinculados e historias clínicas.'
      : audience === 'admin'
        ? 'Hola, soy el asistente de PetQR. Estoy disponible para ayudarte con el uso y la administración de la plataforma.'
      : '¡Hola! Soy el asistente de PetQR y estoy disponible para resolver tus dudas sobre la aplicación, cómo usarla y la información compartida por el equipo.',
  }
}

function formatActionDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function actionDetails(action: AssistantAction) {
  if (action.tipo === 'turno') {
    return [
      `Mascota: ${action.mascota_nombre}`,
      `Inicio: ${formatActionDate(action.datos.fecha_hora_inicio)}`,
      `Fin: ${formatActionDate(action.datos.fecha_hora_fin)}`,
      `Motivo: ${action.datos.tipo_servicio}`,
      ...(action.datos.observaciones ? [`Observaciones: ${action.datos.observaciones}`] : []),
    ]
  }

  if (action.tipo === 'historia_clinica_nueva') {
    return [
      `Mascota: ${action.mascota_nombre}`,
      `Motivo: ${action.datos.motivo_consulta}`,
      ...(action.datos.diagnostico ? [`Diagnóstico: ${action.datos.diagnostico}`] : []),
      ...(action.datos.tratamiento ? [`Tratamiento: ${action.datos.tratamiento}`] : []),
      ...(action.datos.peso_kg != null ? [`Peso: ${action.datos.peso_kg} kg`] : []),
      ...(action.datos.temperatura_c != null ? [`Temperatura: ${action.datos.temperatura_c} °C`] : []),
    ]
  }

  const labels: Record<string, string> = {
    motivo_consulta: 'Motivo',
    diagnostico: 'Diagnóstico',
    tratamiento: 'Tratamiento',
    peso_kg: 'Peso (kg)',
    temperatura_c: 'Temperatura (°C)',
  }
  return [
    `Registro: ${action.mascota_nombre} · ${formatActionDate(action.fecha_consulta)}`,
    `Motivo actual: ${action.motivo_actual}`,
    ...Object.entries(action.datos_actualizados)
      .filter(([, value]) => value != null)
      .map(([key, value]) => `${labels[key] || key}: ${value}`),
  ]
}

export function PetAssistantChat({ audience }: PetAssistantChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatEntry[]>([introduction(audience)])
  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [isConfirmingAction, setIsConfirmingAction] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const voiceBaseQuestionRef = useRef('')
  const pendingActionRef = useRef(false)

  useEffect(() => () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.stop()
  }, [])

  function startVoiceInput() {
    const SpeechRecognition = getSpeechRecognitionConstructor()
    if (!SpeechRecognition) {
      setVoiceStatus('Este navegador no admite dictado por voz. Podés escribir tu pregunta.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.interimResults = true
    recognition.continuous = false
    voiceBaseQuestionRef.current = question.trim()
      ? `${question.trim()} `
      : ''
    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) finalTranscript += result[0].transcript
        else interimTranscript += result[0].transcript
      }
      setQuestion(`${voiceBaseQuestionRef.current}${finalTranscript}${interimTranscript}`)
    }
    recognition.onerror = (event) => {
      setVoiceStatus(event.error === 'not-allowed'
        ? 'No se concedió permiso para usar el micrófono.'
        : 'No se pudo reconocer el audio. Intentá nuevamente o escribí tu pregunta.')
      setIsListening(false)
      recognitionRef.current = null
    }
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      setVoiceStatus('Dictado finalizado. Revisá el texto y enviá tu pregunta.')
    }

    recognitionRef.current = recognition
    setVoiceStatus('Escuchando… hablá ahora.')
    setIsListening(true)
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setIsListening(false)
      setVoiceStatus('No se pudo iniciar el micrófono. Intentá nuevamente.')
    }
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop()
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const currentQuestion = question.trim()
    if (!currentQuestion || isSending) return
    stopVoiceInput()
    setVoiceStatus('')

    const history: AssistantMessage[] = messages
      .slice(1)
      .map(({ role, content }) => ({ role, content }))
    const nextMessages: ChatEntry[] = [...messages, { role: 'user', content: currentQuestion }]
    setMessages(nextMessages)
    setQuestion('')
    setIsSending(true)
    try {
      if (audience === 'veterinario') {
        const actionResult = await knowledgeApi.proposeAction(
          currentQuestion,
          history,
          pendingActionRef.current,
        )
        if (actionResult.estado !== 'sin_accion') {
          pendingActionRef.current = actionResult.estado === 'aclaracion'
          setMessages([
            ...nextMessages,
            {
              role: 'assistant',
              content: actionResult.mensaje || 'Necesito algunos datos más para continuar.',
              ...(actionResult.accion
                ? { action: actionResult.accion, actionStatus: 'pending' as const }
                : {}),
            },
          ])
          return
        }
        pendingActionRef.current = false
      }

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

  async function confirmAction(messageIndex: number, action: AssistantAction) {
    if (isConfirmingAction) return
    setIsConfirmingAction(true)
    try {
      const result = await knowledgeApi.confirmAction(action)
      if (action.tipo === 'turno' && (!result.turno_id || !result.fecha_hora_inicio)) {
        throw new Error(
          'El servidor no devolvió la confirmación de persistencia del turno. '
          + 'Reiniciá el backend actualizado y volvé a intentarlo.',
        )
      }
      setMessages((current) => [
        ...current.map((message, index) => index === messageIndex
          ? { ...message, actionStatus: 'confirmed' as const }
          : message),
        {
          role: 'assistant',
          content: result.turno_id
            ? `${result.respuesta} (ID del turno: ${result.turno_id})`
            : result.respuesta,
          sources: result.fuentes,
        },
      ])
      window.dispatchEvent(new CustomEvent('veterinarian-data-refresh', {
        detail: { fecha_hora_inicio: result.fecha_hora_inicio },
      }))
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error instanceof Error
            ? `No se pudo confirmar la acción: ${error.message}`
            : 'No se pudo confirmar la acción. Revisá los datos e intentá nuevamente.',
        },
      ])
    } finally {
      setIsConfirmingAction(false)
    }
  }

  function cancelAction(messageIndex: number) {
    setMessages((current) => current.map((message, index) => index === messageIndex
      ? { ...message, actionStatus: 'cancelled' }
      : message))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) stopVoiceInput()
        setOpen(nextOpen)
      }}
    >
      <div className="fixed bottom-24 right-4 z-40 flex items-end gap-3 sm:bottom-6 sm:right-24">
        {!open && (
          <div className="max-w-56 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
            Estoy disponible para ayudarte con tus dudas.
          </div>
        )}
        <DialogTrigger asChild>
          <Button
            size="icon"
            aria-label="Abrir asistente PetQR"
            className="h-14 w-14 rounded-full bg-sky-700 text-white shadow-lg hover:bg-sky-800"
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
              : audience === 'admin'
                ? 'Consultas sobre el uso y la administración de PetQR.'
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
              {message.action && (
                <div className="mt-3 rounded-md border border-current/20 bg-background/70 p-3">
                  <p className="font-semibold">
                    {message.action.tipo === 'turno'
                      ? 'Turno propuesto'
                      : message.action.tipo === 'historia_clinica_nueva'
                        ? 'Nueva historia clínica propuesta'
                        : 'Actualización de historia clínica propuesta'}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {actionDetails(message.action).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  {message.actionStatus === 'pending' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={isConfirmingAction}
                        onClick={() => {
                          if (message.action) void confirmAction(index, message.action)
                        }}
                      >
                        {isConfirmingAction
                          ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          : <Check className="mr-1 h-4 w-4" />}
                        Confirmar y guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isConfirmingAction}
                        onClick={() => cancelAction(index)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-medium">
                      {message.actionStatus === 'confirmed'
                        ? 'Acción confirmada.'
                        : 'Acción cancelada; no se guardaron cambios.'}
                    </p>
                  )}
                </div>
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
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            aria-label={isListening ? 'Detener dictado por voz' : 'Dictar pregunta por voz'}
            title={isListening ? 'Detener dictado' : 'Dictar pregunta por voz'}
            disabled={isSending}
            onClick={isListening ? stopVoiceInput : startVoiceInput}
          >
            {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button type="submit" size="icon" aria-label="Enviar pregunta" disabled={isSending || !question.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="px-3 pb-3 text-xs text-muted-foreground" aria-live="polite">
          {voiceStatus || 'Podés dictar tu pregunta con el micrófono; se transcribirá antes de enviarla.'}
        </p>
      </DialogContent>
    </Dialog>
  )
}
