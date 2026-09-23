'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, FileText, Paperclip, MessageCircle, QrCode, Users, PawPrint, Phone, User, Loader2, BookOpen, Clock, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'

interface VeterinarianDashboardProps {
  data: any
  user: any
}

export default function VeterinarianDashboard({ data, user }: VeterinarianDashboardProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || ''
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileData.nombre.trim() || !profileData.telefono.trim()) {
      toast.error("Por favor, completa todos los campos.")
      return
    }

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
        telefono: cleanPhone
      })
      
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

  // Datos del dashboard del veterinario
  const veterinarioStats = data?.stats || {
    turnos_hoy: 0,
    turnos_proximos: 0,
    historias_clinicas: 0,
    mascotas_activas: 0,
    qrs_asignados: 0,
    documentos_cargados: 0
  }

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Veterinario</h1>
          <p className="text-muted-foreground text-sm">
            Gestión de turnos, historias clínicas, mascotas y base de conocimiento
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Link href="/dashboard/veterinario/turnos" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4" />
              Nuevo Turno
            </Button>
          </Link>
          <Link href="/dashboard/veterinario/conocimiento" className="flex-1 sm:flex-initial">
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Paperclip className="w-4 h-4" />
              Cargar Documento
            </Button>
          </Link>
        </div>
      </div>

      {/* SECCIÓN DE ESTADÍSTICAS + PERFIL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Estadísticas Principales */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
          {/* Turnos de Hoy */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Turnos Hoy
              </CardTitle>
              <Clock className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{veterinarioStats.turnos_hoy}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Consultas programadas
              </p>
            </CardContent>
          </Card>

          {/* Turnos Próximos */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximos Turnos
              </CardTitle>
              <Calendar className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{veterinarioStats.turnos_proximos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Próximos 7 días
              </p>
            </CardContent>
          </Card>

          {/* Historias Clínicas */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Historias Clínicas
              </CardTitle>
              <FileText className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{veterinarioStats.historias_clinicas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registradas
              </p>
            </CardContent>
          </Card>

          {/* Mascotas Activas */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mascotas Activas
              </CardTitle>
              <PawPrint className="w-5 h-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{veterinarioStats.mascotas_activas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                En seguimiento
              </p>
            </CardContent>
          </Card>

          {/* QRs Asignados */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                QRs Disponibles
              </CardTitle>
              <QrCode className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-emerald-600">{veterinarioStats.qrs_asignados}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sin vincular
              </p>
            </CardContent>
          </Card>

          {/* Documentos Base de Conocimiento */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Base de Conocimiento
              </CardTitle>
              <BookOpen className="w-5 h-5 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-cyan-600">{veterinarioStats.documentos_cargados}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Documentos cargados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Perfil del Veterinario */}
        <Card className="border-muted/60 shadow-sm flex flex-col justify-between bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="w-12 h-12 rounded-full border bg-muted/40 shrink-0">
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {currentUser?.nombre ? currentUser.nombre.substring(0, 2).toUpperCase() : 'V'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-0.5">
              <h3 className="font-bold text-sm truncate text-foreground">
                {currentUser?.nombre || 'Veterinario'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser?.email}
              </p>
              <Badge variant="secondary" className="text-xs mt-1.5 w-fit">
                Veterinario
              </Badge>
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
                    Mantén tus datos de contacto actualizados para notificaciones importantes.
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
                    <Label htmlFor="telefono">Teléfono Contacto</Label>
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

      {/* MENU PRINCIPAL DE OPERACIONES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Gestionar Turnos */}
        <Link href="/dashboard/veterinario/turnos">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Turnos</h3>
                  <p className="text-sm text-muted-foreground">Crear y gestionar agenda</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Historias Clínicas */}
        <Link href="/dashboard/veterinario/historias-clinicas">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Historias Clínicas</h3>
                  <p className="text-sm text-muted-foreground">Registros médicos de mascotas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Base de Conocimiento */}
        <Link href="/dashboard/veterinario/conocimiento">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Base de Conocimiento</h3>
                  <p className="text-sm text-muted-foreground">Cargar documentos y referencias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Chatbot de Consultas */}
        <Link href="/dashboard/veterinario/chatbot">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Chatbot IA</h3>
                  <p className="text-sm text-muted-foreground">Consultas inteligentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Gestión de Mascotas */}
        <Link href="/dashboard/veterinario/mascotas">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Mascotas</h3>
                  <p className="text-sm text-muted-foreground">Listado y perfiles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Gestión de QRs */}
        <Link href="/dashboard/veterinario/qr">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">QR</h3>
                  <p className="text-sm text-muted-foreground">Asignar y vincular QRs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Dueños de Mascotas */}
        <Link href="/dashboard/veterinario/duenos">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Dueños</h3>
                  <p className="text-sm text-muted-foreground">Propietarios registrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Escaneos */}
        <Link href="/dashboard/veterinario/escaneos">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Escaneos</h3>
                  <p className="text-sm text-muted-foreground">Registro de actividad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* TARJETA DE INFORMACIÓN RÁPIDA */}
      <Card className="border-muted/60 shadow-sm bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Acceso a Chatbot
          </CardTitle>
          <CardDescription>
            Como veterinario, tienes acceso a un chatbot inteligente que consulta tu base de conocimiento.
            Los usuarios comunes también pueden hacer consultas limitadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Carga documentos, referencias y protocolos. El chatbot responderá preguntas basadas en tu conocimiento, 
            respetando la privacidad de datos de usuarios específicos.
          </p>
          <Link href="/dashboard/veterinario/chatbot">
            <Button className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Ir al Chatbot
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
