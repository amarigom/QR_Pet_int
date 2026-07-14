'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { QrCode, Mail, Lock, User, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api' 
import { useContext } from 'react'
import { AuthContext } from '@/app/context/auth/AuthContext'

function RegisterForm() {
  const router = useRouter()
  const { login } = useContext(AuthContext)
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect')
  const redirectUrl = rawRedirect ? rawRedirect.split('&')[0].split('?')[0] : null
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword:'',
    telefono: ''
  })

  // Manejador único para actualizar los inputs del estado
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // 🎯 1. VALIDACIÓN: Ningún campo obligatorio puede estar vacío (Incluyendo teléfono ahora)
    if (
      !formData.nombre.trim() || 
      !formData.email.trim() || 
      !formData.password.trim() || 
      !formData.confirmPassword.trim() ||
      !formData.telefono.trim()
    ) {
      toast.error("Por favor, completa todos los campos obligatorios.")
      return
    }

    // 🎯 2. VALIDACIÓN: Formato de correo electrónico (algo@algo.ext)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Por favor, ingresa un correo electrónico válido (ej: usuario@dominio.com).")
      return
    }

    // 🎯 2b. VALIDACIÓN Y LIMPIEZA DEL TELÉFONO: Formato internacional para WhatsApp
    // Dejamos solo números y el símbolo '+' si ya lo tiene
    let cleanPhone = formData.telefono.trim().replace(/[^\d+]/g, '')
    
    // Si no empieza con '+', se lo inyectamos automáticamente (asumiendo formato numérico puro)
    if (cleanPhone && !cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`
    }

    // Regex internacional estándar de WhatsApp: un '+' seguido de entre 10 y 15 dígitos
    const phoneRegex = /^\+[1-9]\d{9,14}$/
    if (!phoneRegex.test(cleanPhone)) {
      toast.error("Por favor, ingresa un teléfono válido con código de país (ej: +5492494112233).")
      return
    }

    // 🎯 3. VALIDACIÓN: Largo de la contraseña (Mínimo 6 caracteres)
    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    // 🎯 4. VALIDACIÓN: Caracteres especiales en la contraseña
    const specialCharRegex = /[^A-Za-z0-9]/
    if (!specialCharRegex.test(formData.password)) {
      toast.error("La contraseña debe contener al menos un carácter especial (ej: @, #, $, %, *, !, ?).")
      return
    }

    // 🎯 5. VALIDACIÓN: Coincidencia de contraseñas
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden. Por favor, verifícalas.")
      return
    }
    
    setIsLoading(true)

    try {
      // 1. Registramos al usuario en la base de datos
      await authApi.register({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        telefono: cleanPhone,
      })
      
      toast.success("¡Cuenta creada con éxito!")

      // 2.Iniciamos sesión usando la función global de AuthProvider
      // Esto actualiza el estado 'user' de React inmediatamente
      await login(formData.email, formData.password)

      
      if (redirectUrl) {
        setTimeout(() => {
          router.push(redirectUrl)
        }, 1000)
      }

    } catch (error) {
      console.error("Error en registro:", error)
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error al registrar la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <QrCode className="w-7 h-7 text-primary-foreground" />
          </div>
        </Link>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Regístrate para gestionar tus mascotas y activar tus códigos QR
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo: Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="nombre"
                type="text"
                placeholder="Juan Pérez"
                className="pl-10"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Campo: Correo Electrónico */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Campo: Teléfono (Crucial para cuando encuentren la mascota) */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono de Contacto</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="telefono"
                type="tel"
                placeholder="+54 11 2345 6789"
                className="pl-10"
                value={formData.telefono}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 👇 CAMPO AGREGADO: Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Botón de Envío con Spinner */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Creando cuenta...
              </>
            ) : (
              'Registrarse'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link 
            href={redirectUrl ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/login'} 
            className="text-primary hover:underline font-medium"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

//  El Contenedor Root protegido con Suspense para compilar sin CSR Bailout
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      <Suspense fallback={
        <Card className="w-full max-w-md p-8 flex items-center justify-center">
          <Spinner className="w-8 h-8 text-primary" />
        </Card>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  )
}