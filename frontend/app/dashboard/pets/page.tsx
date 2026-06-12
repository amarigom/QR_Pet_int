'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PawPrint, QrCode, Eye, Palette } from 'lucide-react'
import { petsApi } from '@/lib/api'
import type { Pet, PaginatedResponse } from '@/lib/types'

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPets() {
      try {
        setIsLoading(true)
        const response = await petsApi.getAll() as unknown as PaginatedResponse<Pet>
        setPets(response.items || [])
      } catch (error) {
        console.error('Error loading pets:', error)
        setPets([]) 
      } finally {
        setIsLoading(false)
      }
    }
    loadPets()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis Mascotas</h1>
          <p className="text-muted-foreground">Gestiona la información de tus mascotas</p>
        </div>
        <Link href="/dashboard/activate">
          <Button>
            <QrCode className="w-4 h-4 mr-2" />
            Activar QR
          </Button>
        </Link>
      </div>

      {pets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin mascotas registradas</h3>
              <p className="text-muted-foreground mb-4">
                Activa un código QR para registrar tu primera mascota
              </p>
              <Link href="/dashboard/activate">
                <Button>
                  <QrCode className="w-4 h-4 mr-2" />
                  Activar QR
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/dashboard/pets/${pet.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full group flex flex-col justify-between overflow-hidden">
                <CardContent className="p-0 flex flex-col h-full">
                  
                  {/* Pet Image with overlay Status badge */}
                  <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
                    {pet.foto_url ? (
                      <img
                        src={pet.foto_url}
                        alt={pet.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                        <PawPrint className="w-16 h-16 text-primary/20" />
                      </div>
                    )}
                    
                    {/* Dynamic Status Badge over the photo */}
                    <div className="absolute top-2 right-2">
                      <Badge variant={pet.estado === 'en_casa' ? 'default' : 'destructive'} className="shadow-sm">
                        {pet.estado === 'en_casa' ? 'En casa' : pet.estado === 'perdido' ? 'Perdido' : pet.estado}
                      </Badge>
                    </div>
                  </div>

                  {/* Pet Info Body */}
                  <div className="p-4 flex flex-col justify-between flex-1 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors truncate">
                          {pet.nombre || 'Sin nombre'}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold tracking-wide uppercase">
                          <QrCode className="w-3 h-3 mr-1 text-primary" />
                          QR Activo
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize truncate">
                        {pet.especie}
                        {pet.raza && ` - ${pet.raza}`}
                      </p>
                    </div>

                    {/* Metadata attributes (Color & Age) */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                      {pet.color && (
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-muted">
                          <Palette className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span className="truncate max-w-[100px]">{pet.color}</span>
                        </div>
                      )}
                      {pet.edad_aproximada && (
                        <div className="bg-muted/50 px-2 py-1 rounded-md border border-muted">
                          <span>{pet.edad_aproximada}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer Indicator */}
                    <div className="pt-2 border-t mt-auto">
                      <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-between p-0 group-hover:text-primary transition-colors">
                        <span className="flex items-center text-xs font-medium">
                          <Eye className="w-4 h-4 mr-1.5" />
                          Ver ficha médica y QR
                        </span>
                        <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}