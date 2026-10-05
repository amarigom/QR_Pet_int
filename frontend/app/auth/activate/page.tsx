'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api/auth'

export default function ActivateAccountPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '')
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmation) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    if (!token) {
      toast.error('El enlace de activación no contiene un token válido.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.activateAccount({ token, password })
      setIsActivated(true)
      setToken('')
      toast.success('Cuenta activada. Ya podés iniciar sesión.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo activar la cuenta.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isActivated ? 'Cuenta activada' : 'Activá tu cuenta'}</CardTitle>
          <CardDescription>
            {isActivated
              ? 'Tu cuenta ya está lista. Ingresá con tu correo y la contraseña que acabás de elegir.'
              : 'Elegí una contraseña privada para completar el acceso a QR Pet.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isActivated ? (
            <Button asChild className="w-full">
              <Link href="/auth/login">Ir a iniciar sesión</Link>
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activation-password">Nueva contraseña</Label>
                <Input
                  id="activation-password"
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activation-confirmation">Confirmar contraseña</Label>
                <Input
                  id="activation-confirmation"
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                {isLoading ? 'Activando…' : 'Activar y guardar contraseña'}
              </Button>
              {!token && (
                <p role="alert" className="text-sm text-destructive">
                  No se encontró un token. Solicitá al veterinario un nuevo enlace de activación.
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
