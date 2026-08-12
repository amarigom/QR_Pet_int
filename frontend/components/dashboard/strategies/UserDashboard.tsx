
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PawPrint, QrCode, PlusCircle, Map, Phone, User, Loader2 ,MapPin} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserDashboardData, PetData } from '@/lib/types/dashboard'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'

// Importación del nuevo mapa unificado y optimizado
import { ScanMapProvider } from '@/components/map/map-provider'
import type { ScanWithLocation } from '@/lib/types'

interface UserDashboardProps {
  data: UserDashboardData
  user: any
  allPets: any[]
  recent_scans?: ScanWithLocation[]
}

export default function UserDashboard({ data, user }: UserDashboardProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estado local para forzar el renderizado inmediato del usuario actualizado
  const [currentUser, setCurrentUser] = useState(user)

  // Estado local para el formulario de edición rápida del perfil
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || ''
  })

  // Extracción segura de datos
  const pets = data?.pets || []
  const summary = data?.summary || { total_pets: pets.length, active_qrs: 10 }
  const misScans = data?.recent_activity || []

  // Manejo del guardado del celular
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileData.nombre.trim() || !profileData.telefono.trim()) {
      toast.error("Por favor, completa todos los campos.")
      return
    }

    // Limpieza de formato internacional para WhatsApp
    let cleanPhone = profileData.telefono.trim().replace(/[^\d+]/g, '')
    if (cleanPhone && !cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`
    }

    const phoneRegex = /^\+[1-9]\d{9,14}$/
    if (!phoneRegex.test(cleanPhone)) {
      toast.error("Número inválido. Usa formato internacional (ej: +5492494112233).")
      return
    }

    setIsSaving(true)
    try {
      const updatedUser = await authApi.updateProfile({
        nombre: profileData.nombre.trim(),
        telefono: cleanPhone,
        direccion: profileData.direccion.trim() || null
      })
      
      // Actualizamos el estado local para reflejar el cambio al milisegundo
      setCurrentUser(updatedUser)
      
      toast.success("¡Datos de contacto guardados!")
      setIsModalOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar contacto')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Panel</h1>
          <p className="text-muted-foreground text-sm">
            Gestioná tus mascotas y controlá el estado de tus códigos QR.
          </p>
        </div>
        <Link href="/dashboard/activate" passHref>
          <Button className="flex items-center gap-2 w-full sm:w-auto shadow-sm">
            <PlusCircle className="w-4 h-4" />
            Activar nuevo QR
          </Button>
        </Link>
      </div>

      {/* SECCIÓN DE METRICAS + TARJETA DE PERFIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Contadores (Mascotas y QRs) */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mascotas Registradas
              </CardTitle>
              <PawPrint className="w-5 h-5 text-primary/70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{summary.total_pets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.total_pets === 1 ? '1 mascota protegida' : `${summary.total_pets} mascotas protegidas`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Códigos QR Activos
              </CardTitle>
              <QrCode className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-emerald-600">
                {summary.active_qrs}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Chapitas vinculadas y operativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tarjeta de Perfil del Propietario */}
        <Card className="border-muted/60 shadow-sm flex flex-col justify-between bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="w-12 h-12 rounded-full border bg-muted/40 shrink-0">
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {currentUser?.nombre ? currentUser.nombre.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-0.5">
              <h3 className="font-bold text-sm truncate text-foreground">
                {currentUser?.nombre || 'Usuario'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser?.email}
              </p>
              <p className="text-xs font-medium flex items-center gap-1 mt-1">
                <Phone className={`w-3 h-3 ${currentUser?.telefono ? 'text-emerald-600' : 'text-amber-500'}`} />
                {currentUser?.telefono ? (
                  <span className="font-mono text-emerald-700">{currentUser.telefono}</span>
                ) : (
                  <span className="text-amber-600 font-semibold">Falta WhatsApp</span>
                )}
              </p>
                {/* 👈 NUEVO: Mostrar Domicilio si existe */}
                {currentUser?.direccion && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{currentUser.direccion}</span>
              </p>
                )}
            </div>
          </CardContent>
          <div className="px-4 pb-4 pt-0">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Modificar contacto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Mis Datos de Contacto</DialogTitle>
                  <DialogDescription>
                    Asegurate de que tu número de WhatsApp esté correcto para recibir alertas en tiempo real.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="nombre"
                        value={profileData.nombre}
                        onChange={(e) => setProfileData(prev => ({ ...prev, nombre: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono Celular (WhatsApp)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="telefono"
                        type="tel"
                        placeholder="+54 9 249 411 2233"
                        value={profileData.telefono}
                        onChange={(e) => setProfileData(prev => ({ ...prev, telefono: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Incluí código de país (ej: +54) seguido de tu celular con código de área.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Domicilio / Dirección <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="direccion"
                        type="text"
                        placeholder="Ej: Av. España 450, Tandil"
                        value={profileData.direccion}
                        onChange={(e) => setProfileData(prev => ({ ...prev, direccion: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Dirección de contacto en caso de emergencia.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>

      {/* 🗺️ SECCIÓN DEL MAPA DE ESCANEOS RECIENTES */}
      <Card className="border-muted/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Ubicaciones de Escaneo
          </CardTitle>
          <CardDescription>
            Últimos lugares reportados donde las personas escanearon las chapitas de tus mascotas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border bg-card">
            <ScanMapProvider scans={misScans} />
          </div>
        </CardContent>
      </Card>

      {/* 🐾 GRILLA DE MASCOTAS */}
      <Card className="border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Mis Mascotas</CardTitle>
          <CardDescription>
            Hacé clic en cualquier tarjeta para ver su perfil, historial de escaneos y editar sus datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No hay mascotas registradas</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">
                Comenzá activando un código QR para vincular tu primer perfil.
              </p>
              <Link href="/dashboard/activate" passHref>
                <Button variant="outline">Activar mi primer QR</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet: PetData) => {
                const tieneFotoValida = pet.foto_url && pet.foto_url !== 'string' && pet.foto_url.trim() !== ''

                return (
                  <Link key={pet.id} href={`/dashboard/pets/${pet.id}`} passHref>
                    <Card className="hover:shadow-md transition-all hover:border-primary/40 cursor-pointer h-full border-muted/60 flex flex-col justify-between group bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16 rounded-lg border bg-muted/40 shrink-0">
                            {tieneFotoValida ? (
                              <img 
                                src={pet.foto_url} 
                                alt={pet.nombre} 
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <AvatarFallback className="rounded-lg bg-primary/5 w-full h-full flex items-center justify-center">
                                <PawPrint className="w-7 h-7 text-primary/40 group-hover:scale-110 transition-transform" />
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="font-bold text-base leading-none truncate text-foreground group-hover:text-primary transition-colors">
                              {pet.nombre}
                            </h3>
                            <p className="text-xs text-muted-foreground capitalize truncate">
                              {pet.especie} {pet.raza && `• ${pet.raza}`}
                            </p>
                            
                            {pet.qr && (
                              <div className="pt-0.5">
                                <Badge variant="outline" className="font-mono text-[10px] tracking-tight bg-background px-1.5 py-0">
                                  QR: {pet.qr.codigo}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}