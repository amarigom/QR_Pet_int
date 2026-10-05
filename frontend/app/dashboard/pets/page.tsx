'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PawPrint, QrCode, Eye, Palette, MapPin } from 'lucide-react'
import { PaginationControls } from '@/components/dashboard/pagination-controls'
import { petsApi } from '@/lib/api'
import { veterinarianApi } from '@/lib/api/veterinarian'
import { useAuth } from '@/app/context/auth/AuthContext'
import type { Pet } from '@/lib/types'
import type { VeterinarianPet } from '@/lib/types/veterinarian'

export default function PetsPage() {
  const { user, loading: authLoading } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [veterinarianPets, setVeterinarianPets] = useState<VeterinarianPet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPets, setTotalPets] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const pageSize = 20
  const isVeterinarian = user?.rol === 'veterinario'

  useEffect(() => {
    if (authLoading || !user) return

    async function loadPets() {
      try {
        setIsLoading(true)
        setLoadError(null)
        if (user?.rol === 'veterinario') {
          const response = await veterinarianApi.getDashboard()
          setVeterinarianPets(response.pets)
          return
        }
        const response = await petsApi.getAll(page, pageSize, search)
        setPets(response.items || [])
        setTotalPets(response.total)
      } catch (error) {
        console.error('Error loading pets:', error)
        setLoadError('No se pudo cargar la lista de mascotas.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadPets()
  }, [authLoading, user, page, search])

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <h1 className="text-2xl font-bold">{isVeterinarian ? 'Mascotas de la veterinaria' : 'Mis Mascotas'}</h1>
          <p className="text-muted-foreground">
            {isVeterinarian
              ? 'Pacientes vinculados a tus turnos e historias clínicas.'
              : 'Gestiona la información de tus mascotas'}
          </p>
        </div>
        {isVeterinarian ? (
          <Link href="/dashboard/map" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <MapPin className="w-4 h-4 mr-2" />
              Ver escaneos
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/activate" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <QrCode className="w-4 h-4 mr-2" />
              Activar QR
            </Button>
          </Link>
        )}
      </div>

      {!isVeterinarian && !loadError && (
        <form
          className="flex max-w-xl flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <Input
            aria-label="Buscar mascotas y códigos QR"
            placeholder="Buscar por mascota, especie o código QR"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
      )}

      {loadError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">{loadError}</CardContent>
        </Card>
      ) : isVeterinarian ? (
        veterinarianPets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Todavía no hay pacientes vinculados</h3>
              <p className="text-muted-foreground">
                Las mascotas aparecerán aquí cuando tengan un turno o una historia clínica contigo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {veterinarianPets.map((pet) => (
              <Card key={pet.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-primary" />
                      {pet.nombre}
                    </CardTitle>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                      {pet.especie} · {pet.estado.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <Badge variant={pet.qr?.activo ? 'default' : 'secondary'}>
                    {pet.qr?.activo ? 'QR activo' : 'Sin QR activo'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {pet.qr ? `Código QR: ${pet.qr.codigo}` : 'No tiene un QR activo asociado.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : pets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {search ? 'No hay mascotas que coincidan con la búsqueda' : 'Sin mascotas registradas'}
              </h3>
              {!search && (
                <>
                  <p className="text-muted-foreground mb-4">
                    Activa un código QR para registrar tu primera mascota
                  </p>
                  <Link href="/dashboard/activate">
                    <Button>
                      <QrCode className="w-4 h-4 mr-2" />
                      Activar QR
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/dashboard/pets/${pet.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full group flex flex-col justify-between overflow-hidden">
                <CardContent className="p-0 flex flex-col h-full">
                  
                  {/* Pet Image with overlay Status badge */}
<div className="aspect-video bg-muted relative overflow-hidden shrink-0">
  {/* 🌟 BLINDAJE DE QA: Verificamos que exista y que no sea la palabra 'string' literal */}
  {pet.foto_url && pet.foto_url !== 'string' && pet.foto_url.startsWith('http') ? (
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
                        {pet.raza || 'Raza no especificada'}
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
        <PaginationControls
          page={page}
          total={totalPets}
          pageSize={pageSize}
          onPageChange={setPage}
        />
        </>
      )}
    </div>
  )
}