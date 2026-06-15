'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi, petsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, PawPrint, Mail, User, Calendar, Database } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminPetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [pet, setPet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const petId = params?.id as string
  useEffect(() => {
    async function loadPetData() {
      try {
        // params.id debe coincidir con el nombre de la carpeta [id]
        const data = await petsApi.getById(petId)
        setPet(data)
      } catch (error) {
        console.error("Error al obtener detalle:", error)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) loadPetData()
  }, [params.id])

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando ficha técnica...</div>
  if (!pet) return <div className="p-10 text-center text-destructive">Mascota no encontrada (404 API).</div>

  const cleanOwnerName = pet.owner?.nombre?.replace(/\s+/g, ' ').trim() || 'No registrado'
  
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4 gap-2"
      >
        <ChevronLeft className="w-4 h-4" /> Volver al listado
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Izquierdo: Card de Identidad */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center border-b pb-6">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <PawPrint className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">{pet.nombre}</CardTitle>
            <Badge variant="secondary" className="mt-2 uppercase tracking-widest text-[10px]">
              ID: {pet.id.slice(0, 8)}
            </Badge>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Especie:</span>
                <span className="font-medium capitalize">{pet.especie || 'N/A'}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Creado el:</span>
                <span className="font-medium">{pet.created_at ? formatDate(pet.created_at) : '---'}</span>
             </div>
          </CardContent>
        </Card>

        {/* Lado Derecho: Información del Dueño y Sistema */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Datos del Propietario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-muted">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Nombre Completo</span>
                </div>
                <p className="text-lg font-semibold">{cleanOwnerName}</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-muted">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Email Registrado</span>
                </div>
                <p className="text-lg font-semibold truncate">{pet.owner?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="p-4 border border-dashed rounded-lg">
              <h4 className="text-sm font-bold mb-2">Metadata del registro</h4>
              <pre className="text-[10px] bg-black text-green-500 p-3 rounded overflow-auto">
                {JSON.stringify(pet, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}