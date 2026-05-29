'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Plus, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin' 
import { formatDateTime } from '@/lib/utils'
import type { AdminQR } from '@/lib/types/admin'

export default function AdminQRPage() {
  const [qrs, setQrs] = useState<AdminQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  // 1. Cargar QRs usando adminApi.getQRs
  async function loadQRs() {
    try {
      setIsLoading(true);
      const data = await adminApi.getQRs(); 
      setQrs(data); 
    } catch (error) {
      toast.error('Error al cargar QRs');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQRs()
  }, [])

  // Acción de alternar estado: se ejecuta al hacer clic sobre el indicador
  async function handleToggleStatus(codigo: string, currentStatus: boolean) {
    setIsUpdatingStatus(codigo)
    try {
      const nuevoEstado = !currentStatus; 
      await adminApi.toggleQRStatus(codigo); 
      toast.success(`Código ${codigo} ${nuevoEstado ? 'activado' : 'desactivado'}`);
      
      // Actualizamos el estado local
      setQrs(prev => prev.map(qr => qr.codigo === codigo ? { ...qr, activo: nuevoEstado } : qr));
    } catch (error) {
      toast.error('Error al cambiar el estado del QR');
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  // 2. Generar usando adminApi.generateQRs
  async function handleGenerate() {
    if (cantidad < 1 || cantidad > 100) {
      toast.error('Cantidad inválida (1-100)')
      return
    }

    setIsGenerating(true)
    try {
      const result = await adminApi.generateQRs(cantidad)
      toast.success(`${result.created} códigos generados`)
      setDialogOpen(false)
      loadQRs() 
    } catch (error) {
      toast.error('Error al generar')
    } finally {
      setIsGenerating(false)
    }
  }

  // 3. Eliminar - ANULADO TEMPORALMENTE (Para futuro superusuario)
  async function handleDelete(qrId: string) {
    toast.error('Acción reservada solo para Superusuarios');
    return;
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-80 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de QRs</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Generar Lote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Nuevos QRs</DialogTitle>
              <DialogDescription>
                Indica cuántos códigos quieres crear para impresión.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating && <Spinner className="mr-2" />} Generar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead className="text-center">Accion</TableHead> 
                <TableHead>Mascota</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrs.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-mono text-xs">{qr.codigo}</TableCell>

                  {/* Estado Vínculo */}
                  <TableCell>
                    <Badge variant={qr.mascota ? "default" : "secondary"}>
                      {qr.mascota ? "Vinculado" : "Libre"}
                    </Badge>
                  </TableCell>

                  {/*El estado es botón interactivo y limpio */}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={
                        qr.activo 
                          ? "bg-green-100/70 hover:bg-green-200 text-green-800 border border-green-200 font-medium h-7 px-3 rounded-full transition-all" 
                          : "bg-red-100/70 hover:bg-red-200 text-red-800 border border-red-200 font-medium h-7 px-3 rounded-full transition-all"
                      }
                      disabled={isUpdatingStatus === qr.codigo}
                      onClick={() => handleToggleStatus(qr.codigo, !!qr.activo)}
                      title={qr.activo ? "Click para desactivar placa" : "Click para activar placa"}
                    >
                      {isUpdatingStatus === qr.codigo ? (
                        <Spinner className="w-3 h-3 mr-1" />
                      ) : qr.activo ? (
                        <Power className="w-3 h-3 mr-1 text-green-600 animate-pulse" />
                      ) : (
                        <PowerOff className="w-3 h-3 mr-1 text-red-500" />
                      )}
                      {qr.activo ? "Activo" : "Desactivado"}
                    </Button>
                  </TableCell>

                  <TableCell>
                    {qr.mascota ? (
                      qr.mascota.nombre
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {qr.mascota?.owner ? (
                      qr.mascota.owner.nombre
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(qr.created_at)}
                  </TableCell>

                  {/* Eliminar - Solo para futuro superusuario */}
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground opacity-30 cursor-not-allowed"
                      disabled
                      title="Acción reservada para Superusuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}