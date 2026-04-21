'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PawPrint, Search, Dog, Cat, HelpCircle,LucideIcon} from 'lucide-react'
import { getAdminPets } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Pet } from '@/lib/types'

type PetWithOwner = Pet & { owner_name: string }

const speciesIcons : Record<string, LucideIcon>= {
  perro: Dog,
  gato: Cat,
  otro: HelpCircle,
}

export default function AdminPetsPage() {
  const [pets, setPets] = useState<PetWithOwner[]>([])
  const [filteredPets, setFilteredPets] = useState<PetWithOwner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadPets() {
      try {
        const data = await getAdminPets()
        setPets(data)
        setFilteredPets(data)
      } catch (error) {
        console.error('Error loading pets:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPets()
  }, [])

  useEffect(() => {
    const filtered = pets.filter(
      (pet) =>
        pet.nombre.toLowerCase().includes(search.toLowerCase()) ||
        pet.owner_name.toLowerCase().includes(search.toLowerCase()) ||
        pet.especie.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredPets(filtered)
  }, [search, pets])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mascotas</h1>
        <p className="text-muted-foreground">Todas las mascotas registradas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                Lista de Mascotas
              </CardTitle>
              <CardDescription>
                {filteredPets.length} de {pets.length} mascotas
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mascota..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mascota</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Raza</TableHead>
                <TableHead>Dueno</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.map((pet) => {
                const SpeciesIcon = speciesIcons[pet.especie] || HelpCircle
                return (
                  <TableRow key={pet.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {pet.foto_url ? (
                          <img
                            src={pet.foto_url}
                            alt={pet.nombre}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <PawPrint className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{pet.nombre}</p>
                          {pet.color && (
                            <p className="text-xs text-muted-foreground">
                              {pet.color}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        <SpeciesIcon className="w-3 h-3 mr-1" />
                        {pet.especie}
                      </Badge>
                    </TableCell>
                    <TableCell>{pet.raza || '-'}</TableCell>
                    <TableCell>{pet.owner_name}</TableCell>
                    <TableCell>{formatDate(pet.created_at)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
