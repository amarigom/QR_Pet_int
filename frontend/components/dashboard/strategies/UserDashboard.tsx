

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, QrCode, MapPin, Eye, Clock } from 'lucide-react'
import { petsApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { Pet } from '@/lib/types'
import type { UserDashboardStats } from '@/lib/types/user'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserDashboard({ user }: { user: any }) {
    const [stats, setStats] = useState<UserDashboardStats | null>(null)
    const [pets, setPets] = useState<Pet[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    async function loadUserData() {
        try {
        setLoading(true)
        const [statsData, petsData] = await Promise.all([
            petsApi.getDashboardStats(),
            petsApi.getAll()
        ])
        setStats(statsData)
        setPets(petsData?.items || [])
        } catch (error) {
        console.error("USER DASHBOARD error:", error)
        } finally {
        setLoading(false)
        }
    }
    loadUserData()
    }, [])

    if (loading) return <div className="p-6 text-center text-muted-foreground"><Skeleton className="h-64 w-full" /></div>

    return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido, {user.nombre || user.email}</p>
        </div>
        <Link href="/dashboard/activate">
            <Button className="shrink-0">
            <QrCode className="w-4 h-4 mr-2" />
            Activar QR
            </Button>
        </Link>
        </div>

      {/* Cards de Estadísticas de Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mis Mascotas</CardTitle>
            <PawPrint className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">{stats?.pets_count || 0}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">QRs Activos</CardTitle>
            <QrCode className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">{stats?.qrs_count || 0}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Escaneos</CardTitle>
            <Eye className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">{stats?.scans_count || 0}</p>
            </CardContent>
        </Card>
        </div>

      {/* Listado de Mascotas Propias */}
        <Card>
        <CardHeader>
            <CardTitle>Mis Mascotas</CardTitle>
            <CardDescription>Gestiona tus mascotas y sus códigos QR activados</CardDescription>
        </CardHeader>
        <CardContent>
            {pets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <PawPrint className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No hay mascotas registradas</h3>
                <p className="text-muted-foreground mb-6">Comienza activando un código QR para tu mascota.</p>
                <Link href="/dashboard/activate">
                <Button variant="outline">Activar mi primer QR</Button>
                </Link>
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((pet) => (
                <Link key={pet.id} href={`/dashboard/pets/${pet.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-muted/60">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden border">
                            {pet.foto_url ? (
                            <img src={pet.foto_url} alt={pet.nombre} className="w-full h-full object-cover" />
                            ) : (
                            <PawPrint className="w-8 h-8 text-primary/40" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate">{pet.nombre}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                            {pet.especie} {pet.raza && `• ${pet.raza}`}
                            </p>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            )}
        </CardContent>
        </Card>
    </div>
    )
}