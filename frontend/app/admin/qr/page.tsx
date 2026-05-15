'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { QrCode, Plus, Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin' // Asegúrate de que la ruta sea correcta
import { formatDateTime } from '@/lib/utils'
import type { AdminQR } from '@/lib/types/admin'

export default function AdminQRPage() {
  const [qrs, setQrs] = useState<AdminQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 1. Cargar QRs usando adminApi.getQRs
  async function loadQRs() {
  try {
    setIsLoading(true);
    // data ya es AdminQR[] gracias al tipado de la API
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
      loadQRs() // Recargamos la lista
    } catch (error) {
      toast.error('Error al generar')
    } finally {
      setIsGenerating(false)
    }
  }

  // 3. Eliminar usando adminApi.deleteQR
  async function handleDelete(qrId: string) {
    try {
      await adminApi.deleteQR(qrId)
      toast.success('Código eliminado')
      setQrs(prev => prev.filter(qr => qr.id !== qrId))
    } catch (error) {
      toast.error('No se pudo eliminar el QR')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
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
              <TableHead>Estado</TableHead>
              <TableHead>Mascota</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrs.map((qr) => (
              <TableRow key={qr.id}>
                <TableCell className="font-mono text-xs">{qr.codigo}</TableCell>

                <TableCell>
                  <Badge variant={qr.mascota ? "default" : "secondary"}>
                    {qr.mascota ? "Vinculado" : "Libre"}
                  </Badge>
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

                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar QR?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Si el código ya fue impreso, quedará invalidado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(qr.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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