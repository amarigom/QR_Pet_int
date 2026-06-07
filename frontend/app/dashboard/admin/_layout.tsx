'use client'

import { useEffect, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  LayoutDashboard,
  Users,
  PawPrint,
  MapPin,
  LogOut,
  Home,
  Shield,
} from 'lucide-react'
import { authApi } from '@/lib/api'
import type { User } from '@/lib/types'



const navItems = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/admin/qr', icon: QrCode, label: 'Codigos QR' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Usuarios' },
  { href: '/dashboard/admin/pets', icon: PawPrint, label: 'Mascotas' },
  { href: '/dashboard/admin/scans', icon: MapPin, label: 'Escaneos' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await authApi.getCurrentUser()
        if (!userData || userData.rol !== 'admin') {
          router.push('/dashboard')
          return
        }
        setUser(userData)
      } catch {
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [router])

  async function handleLogout() {
    await authApi.logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-lg font-medium">Cargando admin...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r hidden lg:block">
        <div className="p-4 border-b">
          <Link href="/dashboard/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold">PetQR</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Admin
              </Badge>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile Nav */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/dashboard/admin" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-primary-foreground" />
                </div>
              </Link>
            </div>

            <div className="hidden lg:block">
              <h2 className="font-semibold text-muted-foreground">
                Panel de Administracion
              </h2>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.nombre.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="font-medium">{user.nombre}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Nav */}
          <nav className="lg:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <item.icon className="w-4 h-4 mr-1" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
