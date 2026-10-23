'use client'

import { useEffect, useRef, useState } from 'react'
import { Compass, Minimize, Smartphone } from 'lucide-react'
import {
  Bodies,
  Body,
  Composite,
  Engine,
  type Body as MatterBody,
} from 'matter-js'

type DeviceOrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const MEDAL_COLORS = ['#ff3b5c', '#00d6c9', '#ffd43b', '#a78bfa', '#ff8a3d']
const MEDAL_WIDTH = 82
const MEDAL_HEIGHT = 54
const WALL_THICKNESS = 100

function limit(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  const cornerRadius = Math.min(radius, width / 2, height / 2)
  context.moveTo(x + cornerRadius, y)
  context.lineTo(x + width - cornerRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + cornerRadius)
  context.lineTo(x + width, y + height - cornerRadius)
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - cornerRadius,
    y + height,
  )
  context.lineTo(x + cornerRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - cornerRadius)
  context.lineTo(x, y + cornerRadius)
  context.quadraticCurveTo(x, y, x + cornerRadius, y)
  context.fill()
}

function drawMedal(
  context: CanvasRenderingContext2D,
  body: MatterBody,
  index: number,
) {
  context.save()
  context.translate(body.position.x, body.position.y)
  context.rotate(body.angle)
  context.fillStyle = MEDAL_COLORS[index % MEDAL_COLORS.length]
  context.shadowColor = 'rgba(0, 0, 0, 0.55)'
  context.shadowBlur = 18
  context.shadowOffsetY = 8
  drawRoundedRect(
    context,
    -MEDAL_WIDTH / 2,
    -MEDAL_HEIGHT / 2,
    MEDAL_WIDTH,
    MEDAL_HEIGHT,
    15,
  )
  context.lineWidth = 3
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  context.stroke()
  context.shadowColor = 'transparent'
  context.shadowBlur = 0
  context.shadowOffsetY = 0

  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.beginPath()
  context.arc(-29, 0, 6, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'rgba(255, 255, 255, 0.95)'
  context.font = '800 19px system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('PetQR', 9, 0)
  context.restore()
}

export function TiltMedalScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const isSensorActiveRef = useRef(false)
  const [isSensorActive, setIsSensorActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [statusMessage, setStatusMessage] = useState(
    'Las medallitas caen y rebotan por gravedad. Mové el cursor o incliná el celular para guiarlas.',
  )

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current)
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  async function exitFullscreen() {
    if (document.fullscreenElement !== fullscreenRef.current) return true

    try {
      await document.exitFullscreen()
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const context = canvas.getContext('2d')
    if (!context) return

    // 1. Crear Motor Matter.js
    const engine = Engine.create({ enableSleeping: false })
    engine.gravity.x = 0
    engine.gravity.y = 1.8
    engine.gravity.scale = 0.001
    engine.positionIterations = 8
    engine.velocityIterations = 8

    const initialRect = container.getBoundingClientRect()
    const initialWidth = initialRect.width || 600
    const initialHeight = initialRect.height || 256
    const initialPositions = [
      [initialWidth * 0.18, 18],
      [initialWidth * 0.5, 18],
      [initialWidth * 0.82, 18],
      [initialWidth * 0.34, 82],
      [initialWidth * 0.66, 82],
    ]

    const medals = MEDAL_COLORS.map((_, index) => {
      const [x, y] = initialPositions[index]
      const body = Bodies.rectangle(
        x,
        y,
        MEDAL_WIDTH,
        MEDAL_HEIGHT,
        {
          chamfer: { radius: 12 },
          restitution: 0.88,
          friction: 0.025,
          frictionAir: 0.002,
          density: 0.001,
        },
      )
      Body.setAngle(body, (index % 2 === 0 ? 1 : -1) * 0.2)
      Body.setVelocity(body, {
        x: (index % 2 === 0 ? 1 : -1) * 0.7,
        y: 3.2 + index * 0.25,
      })
      return body
    })
    Composite.add(engine.world, medals)

    let walls: MatterBody[] = []
    let animationFrame = 0
    let lastFrameTime = 0

    const draw = (w: number, h: number) => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, w, h)
      medals.forEach((medal, index) => drawMedal(context, medal, index))
    }

    const updateBounds = () => {
      const rect = container.getBoundingClientRect()
      const w = rect.width || 600
      const h = rect.height || initialHeight

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * pixelRatio)
      canvas.height = Math.round(h * pixelRatio)

      Composite.remove(engine.world, walls)
      walls = [
        Bodies.rectangle(
          w / 2,
          h + WALL_THICKNESS / 2,
          w * 3,
          WALL_THICKNESS,
          { isStatic: true },
        ),
        Bodies.rectangle(
          -WALL_THICKNESS / 2,
          h / 2,
          WALL_THICKNESS,
          h * 4,
          { isStatic: true },
        ),
        Bodies.rectangle(
          w + WALL_THICKNESS / 2,
          h / 2,
          WALL_THICKNESS,
          h * 4,
          { isStatic: true },
        ),
      ]
      Composite.add(engine.world, walls)
      draw(w, h)
    }

    const animate = (time: number) => {
      const rect = container.getBoundingClientRect()
      const w = rect.width || 600
      const h = rect.height || initialHeight

      const delta = lastFrameTime ? Math.min(time - lastFrameTime, 32) : 1000 / 60
      lastFrameTime = time
      Engine.update(engine, delta)
      draw(w, h)
      animationFrame = window.requestAnimationFrame(animate)
    }

    const updateGravityFromTilt = (event: DeviceOrientationEvent) => {
      if (!isSensorActiveRef.current) return
      if (event.gamma === null || event.beta === null) return
      const gamma = (event.gamma * Math.PI) / 180
      const beta = (event.beta * Math.PI) / 180
      engine.gravity.x = limit(Math.sin(gamma) * 2.5, -2.5, 2.5)
      engine.gravity.y = limit(1.2 + Math.sin(beta) * 1.3, 0.8, 2.5)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isSensorActiveRef.current) return
      const rect = container.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const horizontalPosition = (event.clientX - rect.left) / rect.width
      const verticalPosition = (event.clientY - rect.top) / rect.height
      engine.gravity.x = limit((horizontalPosition - 0.5) * 4, -2.5, 2.5)
      engine.gravity.y = limit(1.1 + verticalPosition * 1.8, 0.9, 2.8)
    }

    // 2. Tarea programada: Impulso/Salto cada 15 segundos
    const jumpInterval = setInterval(() => {
      medals.forEach((medal, index) => {
        // Velocidad vertical hacia arriba (-6 a -9) y ligera variación horizontal
        const randomX = (Math.random() - 0.5) * 5
        const randomY = -6.5 - Math.random() * 2.5
        const randomAngularVelocity = (Math.random() - 0.5) * 0.15

        Body.setVelocity(medal, { x: randomX, y: randomY })
        Body.setAngularVelocity(medal, randomAngularVelocity)
      })
    }, 15000)

    updateBounds()
    animationFrame = window.requestAnimationFrame(animate)

    const resizeObserver = new ResizeObserver(() => updateBounds())
    resizeObserver.observe(container)

    window.addEventListener('deviceorientation', updateGravityFromTilt)
    container.addEventListener('pointermove', handlePointerMove)

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      clearInterval(jumpInterval) // Limpieza del timer al desmontar
      window.removeEventListener('deviceorientation', updateGravityFromTilt)
      container.removeEventListener('pointermove', handlePointerMove)
      resizeObserver.disconnect()
      Engine.clear(engine)
    }
  }, [])

  async function enableTilt() {
    const deviceOrientationEvent =
      window.DeviceOrientationEvent as DeviceOrientationWithPermission | undefined
    if (!deviceOrientationEvent) {
      setStatusMessage('Tu dispositivo no ofrece giroscopio; probá moviendo el cursor.')
      return
    }

    const fullscreenElement = fullscreenRef.current
    const fullscreenRequest =
      fullscreenElement &&
      document.fullscreenEnabled &&
      typeof fullscreenElement.requestFullscreen === 'function'
        ? fullscreenElement.requestFullscreen().then(
            () => true,
            () => false,
          )
        : Promise.resolve(false)

    let permission: 'granted' | 'denied'
    try {
      permission =
        typeof deviceOrientationEvent.requestPermission === 'function'
          ? await deviceOrientationEvent.requestPermission()
          : 'granted'
    } catch {
      await fullscreenRequest
      const exitedFullscreen = await exitFullscreen()
      setStatusMessage(
        exitedFullscreen
          ? 'Error al solicitar acceso al sensor.'
          : 'Error al solicitar acceso al sensor. Presioná Esc para salir de pantalla completa.',
      )
      return
    }

    if (permission !== 'granted') {
      await fullscreenRequest
      const exitedFullscreen = await exitFullscreen()
      setStatusMessage(
        exitedFullscreen
          ? 'No se otorgó permiso para el sensor.'
          : 'No se otorgó permiso para el sensor. Presioná Esc para salir de pantalla completa.',
      )
      return
    }

    const enteredFullscreen = await fullscreenRequest
    isSensorActiveRef.current = true
    setIsSensorActive(true)
    setStatusMessage(
      enteredFullscreen
        ? '¡Giroscopio activado en pantalla completa! Incliná el celular.'
        : 'Giroscopio activado. Este navegador no permite pantalla completa; agregá PetQR a la pantalla de inicio para ocultar la barra.',
    )
  }

  return (
    <div
      ref={fullscreenRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] m-0 flex h-[100dvh] w-full max-w-none flex-col justify-center overflow-y-auto rounded-none border-0 bg-background p-4 shadow-none sm:p-8'
          : 'mx-auto mt-12 w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-4 shadow-xl backdrop-blur sm:p-6'
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Sentí PetQR en movimiento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mové el cursor sobre la caja o incliná el celular para hacer rebotar las medallitas.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void enableTilt()}
            disabled={isSensorActive}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {isSensorActive ? 'Giroscopio activo' : 'Activar giroscopio'}
          </button>
          {isFullscreen && (
            <button
              type="button"
              onClick={() => {
                void exitFullscreen().then((exited) => {
                  if (!exited) {
                    setStatusMessage('No se pudo salir de pantalla completa. Presioná Esc.')
                  }
                })
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Minimize className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative mt-4 w-full touch-none overflow-hidden rounded-2xl border border-white/15 bg-[radial-gradient(ellipse_at_top,#233b59_0%,#101827_65%,#090e17_100%)] shadow-inner ${
          isFullscreen ? 'h-[min(65dvh,520px)]' : 'h-64'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
        />
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/20 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white shadow backdrop-blur">
          
        </span>
      </div>

      <p className="mt-3 min-h-5 text-center text-xs text-muted-foreground">
        {statusMessage}
      </p>
    </div>
  )
}