'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PawPrint, QrCode, Eye } from 'lucide-react'
import { petsApi } from '@/lib/api'
// Importamos PaginatedResponse para el tipado correcto
import type { Pet, PaginatedResponse } from '@/lib/types'

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPets() {
      try {
        setIsLoading(true)
        // 1. Obtenemos la respuesta completa (con metadatos de paginación)
        const response = await petsApi.getAll() as unknown as PaginatedResponse<Pet>
        
        // 2. Extraemos solo el array de 'items' para nuestro estado de mascotas
        // Usamos el fallback [] por seguridad
        setPets(response.items || [])
      } catch (error) {
        console.error('Error loading pets:', error)
        setPets([]) // En caso de error, reseteamos a array vacío
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

      {/* Ahora pets siempre será un array, así que .length y .map funcionarán */}
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
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full group">
                <CardContent className="p-0">
                  {/* Pet Image */}
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {pet.foto_url ? (
                      <img
                        src={pet.foto_url}
                        alt={pet.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                        <PawPrint className="w-16 h-16 text-primary/50" />
                      </div>
                    )}
                  </div>

                  {/* Pet Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{pet.nombre}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {pet.especie}
                          {pet.raza && ` - ${pet.raza}`}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <QrCode className="w-3 h-3 mr-1" />
                        QR
                      </Badge>
                    </div>

                    {pet.color && (
                      <div className="flex items-center gap-2 text-sm">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: pet.color.toLowerCase() }}
                        />
                        <span className="text-muted-foreground">{pet.color}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalles
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