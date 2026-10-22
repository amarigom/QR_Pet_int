'use client'

import { useEffect, useRef, useState } from 'react'
import { Compass, Smartphone } from 'lucide-react'
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

const MEDAL_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#8e7dbe', '#f49d6e']
const MEDAL_WIDTH = 76
const MEDAL_HEIGHT = 48
const WALL_THICKNESS = 48

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
  context.shadowColor = 'rgba(15, 23, 42, 0.16)'
  context.shadowBlur = 12
  context.shadowOffsetY = 5
  drawRoundedRect(
    context,
    -MEDAL_WIDTH / 2,
    -MEDAL_HEIGHT / 2,
    MEDAL_WIDTH,
    MEDAL_HEIGHT,
    15,
  )
  context.shadowColor = 'transparent'
  context.shadowBlur = 0
  context.shadowOffsetY = 0

  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.beginPath()
  context.arc(-25, 0, 5, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'rgba(255, 255, 255, 0.95)'
  context.font = '700 17px system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('QR', 9, 0)
  context.restore()
}

export function TiltMedalScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSensorActive, setIsSensorActive] = useState(false)
  const [statusMessage, setStatusMessage] = useState(
    'Activá el movimiento para inclinar las medallitas.',
  )
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const engine = Engine.create({ enableSleeping: true })
    engine.gravity.scale = 0.001
    const medals = MEDAL_COLORS.map((_, index) => {
      const body = Bodies.rectangle(
        60 + index * 62,
        -30 - index * 62,
        MEDAL_WIDTH,
        MEDAL_HEIGHT,
        {
          chamfer: { radius: 12 },
          restitution: 0.62,
          friction: 0.08,
          frictionAir: 0.012,
          density: 0.002,
        },
      )
      Body.setAngle(body, (index % 2 === 0 ? 1 : -1) * 0.12)
      return body
    })
    Composite.add(engine.world, medals)

    let walls: MatterBody[] = []
    let width = 0
    let height = 0
    let animationFrame = 0
    let lastFrameTime = 0
    let isVisible = true
    let orientationListenerActive = false

    const draw = () => {
      if (!width || !height) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      medals.forEach((medal, index) => drawMedal(context, medal, index))
    }

    const updateBounds = () => {
      const bounds = canvas.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      width = bounds.width
      height = bounds.height
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      Composite.remove(engine.world, walls)
      walls = [
        Bodies.rectangle(
          width / 2,
          height + WALL_THICKNESS / 2,
          width + WALL_THICKNESS * 2,
          WALL_THICKNESS,
          { isStatic: true },
        ),
        Bodies.rectangle(
          -WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height * 2,
          { isStatic: true },
        ),
        Bodies.rectangle(
          width + WALL_THICKNESS / 2,
          height / 2,
          WALL_THICKNESS,
          height * 2,
          { isStatic: true },
        ),
      ]
      Composite.add(engine.world, walls)
      medals.forEach((medal, index) => {
        if (medal.position.y < 0) {
          Body.setPosition(medal, {
            x: width * (0.12 + index * 0.18),
            y: -30 - index * 40,
          })
        }
      })
      draw()
    }

    const animate = (time: number) => {
      if (!isVisible || prefersReducedMotion) return
      const delta = lastFrameTime ? Math.min(time - lastFrameTime, 32) : 1000 / 60
      lastFrameTime = time
      Engine.update(engine, delta)
      draw()
      animationFrame = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (prefersReducedMotion || !isVisible || animationFrame) return
      lastFrameTime = 0
      animationFrame = window.requestAnimationFrame(animate)
    }

    const stopAnimation = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
      lastFrameTime = 0
    }

    const updateGravityFromTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return
      const gamma = (event.gamma * Math.PI) / 180
      const beta = (event.beta * Math.PI) / 180
      engine.gravity.x = limit(Math.sin(gamma) * 1.25, -1.25, 1.25)
      engine.gravity.y = limit(0.85 + Math.sin(beta) * 0.55, 0.2, 1.4)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isSensorActive) return
      const bounds = canvas.getBoundingClientRect()
      const horizontalPosition = (event.clientX - bounds.left) / bounds.width
      const verticalPosition = (event.clientY - bounds.top) / bounds.height
      engine.gravity.x = limit((horizontalPosition - 0.5) * 2.5, -1.25, 1.25)
      engine.gravity.y = limit(0.6 + verticalPosition * 0.8, 0.2, 1.4)
      startAnimation()
    }

    updateBounds()
    const resizeObserver = new ResizeObserver(updateBounds)
    resizeObserver.observe(canvas)

    if (isSensorActive) {
      window.addEventListener('deviceorientation', updateGravityFromTilt)
      orientationListenerActive = true
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) startAnimation()
      else stopAnimation()
    })
    intersectionObserver.observe(canvas)
    canvas.addEventListener('pointermove', handlePointerMove)

    if (!prefersReducedMotion) startAnimation()

    return () => {
      stopAnimation()
      if (orientationListenerActive) {
        window.removeEventListener('deviceorientation', updateGravityFromTilt)
      }
      canvas.removeEventListener('pointermove', handlePointerMove)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      Engine.clear(engine)
    }
  }, [isSensorActive, prefersReducedMotion])

  async function enableTilt() {
    if (prefersReducedMotion) {
      setStatusMessage('La animación está pausada por tu preferencia de movimiento reducido.')
      return
    }

    const deviceOrientationEvent = window.DeviceOrientationEvent
    if (!deviceOrientationEvent) {
      setStatusMessage('Tu dispositivo no ofrece sensor de inclinación; probá mover el cursor.')
      return
    }

    const orientationEvent = deviceOrientationEvent as DeviceOrientationWithPermission
    if (typeof orientationEvent.requestPermission === 'function') {
      try {
        const permission = await orientationEvent.requestPermission()
        if (permission !== 'granted') {
          setStatusMessage('No se habilitó el sensor. Podés inclinar las medallitas con el cursor.')
          return
        }
      } catch {
        setStatusMessage('No se pudo acceder al sensor de movimiento.')
        return
      }
    }

    setIsSensorActive(true)
    setStatusMessage('¡Listo! Incliná el teléfono para mover las medallitas.')
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-4 shadow-xl shadow-black/5 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Sentí PetQR en movimiento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Incliná el celular y mirá cómo rebotan las medallitas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void enableTilt()}
          disabled={prefersReducedMotion || isSensorActive}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          {isSensorActive ? 'Inclinación activada' : 'Activar inclinación'}
        </button>
      </div>
      <div className="relative mt-4 h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/20 via-background to-primary/10 sm:h-48">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="h-full w-full"
        />
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-background/75 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          PetQR · chapitas que cuidan
        </span>
      </div>
      <p className="mt-3 min-h-5 text-center text-xs text-muted-foreground" aria-live="polite">
        {statusMessage}
      </p>
    </div>
  )
}
