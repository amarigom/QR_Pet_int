// 📂 Ubicación: app/dashboard/layout.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  QrCode, 
  Home, 
  PawPrint, 
  MapPin, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  ArrowLeft 
} from 'lucide-react'
import { authApi } from '@/lib/api'
import type { User } from '@/lib/types'
import QrScannerModal from '@/components/QrScannerModal'

// 🟢 Menú para cuando se navega como Usuario Común
const userNavItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/dashboard/pets', icon: PawPrint, label: 'Mis Mascotas' },
  { href: '/dashboard/map', icon: MapPin, label: 'Mapa de Escaneos' },
]

// 🏛️ Menú para cuando se navega en el Panel de Administración (Subrutas unificadas)
const adminNavItems = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard Admin' },
  { href: '/dashboard/admin/qr', icon: QrCode, label: 'Códigos QR' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Usuarios' },
  { href: '/dashboard/admin/pets', icon: PawPrint, label: 'Mascotas' },
  { href: '/dashboard/admin/scans', icon: MapPin, label: 'Escaneos' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 🎯 DETECTAMOS SI EL USUARIO ESTÁ DENTRO DE LA ZONA DE ADMINISTRACIÓN
  const isAdminZone = pathname.startsWith('/dashboard/admin')
  
  // Seleccionamos dinámicamente qué botones mostrar en la barra
  const activeNavItems = isAdminZone ? adminNavItems : userNavItems

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Sesión no válida:", error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadUser()
  }, [loadUser])
  
  async function handleLogout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      router.push('/')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-3 animate-bounce">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <QrCode className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <span className="mt-4 text-muted-foreground font-medium">Cargando tu panel...</span>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 btn-transition">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline text-foreground">PetQR</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {/* 🎯 BOTÓN VOLVER (PC): Aparece solo en la zona de admin para regresar al panel de usuario */}
              {isAdminZone && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-primary/10 mr-2 btn-transition">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Vista Usuario
                  </Button>
                </Link>
              )}

              {activeNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={isActive ? "bg-gradient-to-r from-secondary to-secondary/90 font-semibold text-secondary-foreground shadow-md" : "text-foreground hover:bg-secondary/10 btn-transition"}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-colors hover:bg-muted btn-transition">
                  <Avatar className="h-9 w-9 border-2 border-secondary">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
                      {user.nombre.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-semibold leading-none text-foreground">{user.nombre}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                
                {user.rol === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Panel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden ml-2 border-border"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Overlay (Menú hamburguesa en Celulares) */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* 🎯 BOTÓN VOLVER (CELULAR): Se inyecta arriba de todo si estás gestionando la plataforma */}
            {user.rol === 'admin' && isAdminZone && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="secondary"
                  className="w-full justify-start text-base font-semibold bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:bg-primary/15 mb-2 btn-transition"
                >
                  <ArrowLeft className="w-5 h-5 mr-3" />
                  Volver a mi Dashboard
                </Button>
              </Link>
            )}

            {activeNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={`w-full justify-start text-base btn-transition ${
                    pathname === item.href 
                      ? 'bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground font-semibold' 
                      : 'text-foreground hover:bg-secondary/10'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
        {children}
      </main>

      <QrScannerModal />
    </div>
  )
}
