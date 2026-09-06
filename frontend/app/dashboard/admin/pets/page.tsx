'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PawPrint, Search, Eye, Mail, User, Fingerprint } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminPetsPage() {
  const [pets, setPets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadPets() {
      try {
        const data = await adminApi.getPets()
        // Normalización: Nos aseguramos de tener un array siempre
        const normalizedData = Array.isArray(data) ? data : (data ? [data] : [])
        setPets(normalizedData)
      } catch (error) {
        console.error('Error en el panel de admin:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPets()
  }, [])

  const filteredPets = useMemo(() => {
    const s = search.toLowerCase()
    return pets.filter(p => 
      p.nombre?.toLowerCase().includes(s) || 
      p.owner?.nombre?.toLowerCase().includes(s)
    )
  }, [search, pets])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Cargando registros de administración...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Base de Datos de Mascotas</h1>
          <p className="text-sm text-muted-foreground">Panel de control de todos los registros del sistema</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mascota o dueño..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-muted">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold">Mascota</TableHead>
                <TableHead className="font-bold">Dueño / Responsable</TableHead>
                <TableHead className="font-bold text-center">Registro</TableHead>
                <TableHead className="text-right font-bold pr-6">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.length > 0 ? (
                filteredPets.map((pet) => {
                  // Limpieza de espacios del nombre (Andrea Marigomez)
                  const ownerName = pet.owner?.nombre?.replace(/\s+/g, ' ').trim() || 'N/A'
                  
                  return (
                    <TableRow key={pet.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/5 rounded-lg">
                            <PawPrint className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{pet.nombre}</span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                              {pet.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <div className="flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {pet.owner_name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {pet.owner?.email || 'Sin correo'}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center text-sm text-muted-foreground">
                        {pet.created_at ? formatDate(pet.created_at) : 'Sin fecha'}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <Link 
                          href={`/dashboard/admin/pets/${pet.id}`} 
                          className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border border-muted-foreground/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalles
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                    No se encontraron registros activos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}