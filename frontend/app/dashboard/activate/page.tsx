'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, QrCode, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { qrApi } from '@/lib/api/qr2';

export default function ActivateQRPage() {
  const router = useRouter()
  const [step, setStep] = useState<'code' | 'form'>('code')
  const [code, setCode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [codeStatus, setCodeStatus] = useState<'idle' | 'valid' | 'invalid' | 'used'>('idle')
  
  const [formData, setFormData] = useState({
    nombre: '',
    especie: 'perro',
    raza: '',
    color: '',
    edad_aproximada: '',
    foto_url: '',
    notas: '',
  })

  async function handleCheckCode() {
    if (!code.trim()) {
      toast.error('Ingresa un codigo QR')
      return
    }

    setIsChecking(true)
    try {
      const result = await qrApi.check(code)
      if (result.available) {
        setCodeStatus('valid')
        setStep('form')
        toast.success('Codigo valido. Completa los datos de tu mascota.')
      } else if (result.has_pet) {
        setCodeStatus('used')
        toast.error('Este QR ya esta vinculado a una mascota')
      } else {
        setCodeStatus('invalid')
        toast.error('Codigo no encontrado')
      }
    } catch {
      setCodeStatus('invalid')
      toast.error('Error al verificar el codigo')
    } finally {
      setIsChecking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      await qrApi.activate({
        codigo: code,
        ...formData,
        raza: formData.raza || null,
        color: formData.color || null,
        edad_aproximada: formData.edad_aproximada || null,
        foto_url: formData.foto_url || null,
        notas: formData.notas || null,
      })
      toast.success('Mascota registrada exitosamente')
      router.push('/dashboard')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al activar QR'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      {step === 'code' ? (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Activar Codigo QR</CardTitle>
            <CardDescription>
              Ingresa el codigo que viene en tu placa o collar PetQR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codigo QR</Label>
              <Input
                id="code"
                placeholder="Ej: ABC123XYZ"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setCodeStatus('idle')
                }}
                disabled={isChecking}
                className="text-center text-lg font-mono tracking-wider"
              />
              {codeStatus === 'invalid' && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Codigo no valido
                </p>
              )}
              {codeStatus === 'used' && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Este QR ya tiene una mascota vinculada
                </p>
              )}
            </div>
            <Button 
              onClick={handleCheckCode} 
              className="w-full" 
              disabled={isChecking || !code.trim()}
            >
              {isChecking ? <Spinner className="mr-2" /> : null}
              Verificar Codigo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
              <CheckCircle className="w-4 h-4" />
              Codigo verificado: <span className="font-mono font-bold">{code}</span>
            </div>
            <CardTitle>Datos de tu Mascota</CardTitle>
            <CardDescription>
              Completa la informacion de tu mascota para vincularla al QR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Nombre de tu mascota"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especie">Especie *</Label>
                  <Select
                    value={formData.especie}
                    onValueChange={(value) => setFormData({ ...formData, especie: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro">Perro</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raza">Raza</Label>
                  <Input
                    id="raza"
                    placeholder="Ej: Labrador, Siames..."
                    value={formData.raza}
                    onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="Ej: Negro, Blanco..."
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edad_aproximada">Edad Aproximada</Label>
                <Input
                  id="edad_aproximada"
                  placeholder="Ej: 2 anios, 6 meses..."
                  value={formData.edad_aproximada}
                  onChange={(e) => setFormData({ ...formData, edad_aproximada: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto_url">URL de Foto</Label>
                <Input
                  id="foto_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.foto_url}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  placeholder="Alergias, medicamentos, condiciones especiales..."
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('code')}
                  disabled={isSubmitting}
                >
                  Cambiar Codigo
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner className="mr-2" /> : null}
                  Activar y Registrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
