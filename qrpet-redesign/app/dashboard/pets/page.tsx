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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Mis Mascotas</h1>
          <p className="text-muted-foreground text-lg">Gestiona la información y perfiles de tus mascotas</p>
        </div>
        <Link href="/dashboard/activate">
          <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-elevation-4 btn-transition shrink-0">
            <QrCode className="w-5 h-5 mr-2" />
            Activar QR
          </Button>
        </Link>
      </div>

      {/* Ahora pets siempre será un array, así que .length y .map funcionarán */}
      {pets.length === 0 ? (
        <Card className="border-border shadow-elevation-2">
          <CardContent className="py-16 md:py-20">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto">
                <PawPrint className="w-10 h-10 text-secondary/50" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Sin mascotas registradas</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Activa un código QR para registrar tu primera mascota y comenzar a protegerla
                </p>
              </div>
              <Link href="/dashboard/activate">
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-elevation-4 btn-transition mt-4">
                  <QrCode className="w-5 h-5 mr-2" />
                  Activar QR Ahora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/dashboard/pets/${pet.id}`} className="group">
              <Card className="h-full border-border hover:border-secondary/50 hover:shadow-elevation-4 transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Pet Image */}
                  <div className="aspect-video bg-gradient-to-br from-secondary/10 to-accent/10 rounded-t-2xl overflow-hidden relative">
                    {pet.foto_url ? (
                      <img
                        src={pet.foto_url}
                        alt={pet.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="w-12 h-12 text-secondary/30" />
                      </div>
                    )}
                    {/* QR Badge overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-md">
                        <QrCode className="w-3 h-3 mr-1" />
                        QR
                      </Badge>
                    </div>
                  </div>

                  {/* Pet Info */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{pet.nombre}</h3>
                      <p className="text-sm text-muted-foreground capitalize font-medium">
                        {pet.especie}
                        {pet.raza && ` • ${pet.raza}`}
                      </p>
                    </div>

                    {pet.color && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
                          style={{ backgroundColor: pet.color.toLowerCase() }}
                        />
                        <span className="text-sm text-muted-foreground font-medium">{pet.color}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/50 w-full">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-secondary hover:bg-secondary/10 font-semibold group-hover:text-primary transition-colors btn-transition"
                        asChild
                      >
                        <span>
                          <Eye className="w-4 h-4 mr-1.5" />
                          Ver perfil
                        </span>
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
