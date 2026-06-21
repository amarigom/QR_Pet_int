'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PawPrint, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useAuth } from '@/app/context/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { PetMedicalCard } from '@/components/veterinary'

export default function VeterinaryPetsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [pets, setPets] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.rol !== 'veterinario') {
      router.push('/dashboard')
      return
    }

    // TODO: Fetch pets from clinic
    // const loadPets = async () => {
    //   try {
    //     const data = await veterinaryApi.getClinicPets()
    //     setPets(data)
    //   } catch (error) {
    //     console.error('Error loading pets:', error)
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // loadPets()

    setIsLoading(false)
  }, [user, router])

  const filteredPets = pets.filter(pet =>
    pet.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.especie.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PawPrint className="w-8 h-8 text-primary" />
            Mascotas de Mi Clínica
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona el historial médico de cada mascota</p>
        </div>
        <Link href="/dashboard/veterinary/pets/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Mascota
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mascota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map(pet => (
            <PetMedicalCard
              key={pet.id}
              pet={pet}
              stats={pet.stats}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <PawPrint className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No se encontraron mascotas' : 'No hay mascotas registradas aún'}
            </p>
            <Link href="/dashboard/veterinary/pets/new">
              <Button>Registrar Primera Mascota</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
