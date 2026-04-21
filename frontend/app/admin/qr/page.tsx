'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { QrCode, Plus, Trash2, Copy, Check, PawPrint, User } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminQRs, generateAdminQRs, deleteAdminQR, type AdminQR } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

export default function AdminQRPage() {
  const [qrs, setQrs] = useState<AdminQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  async function loadQRs() {
    try {
      const data = await getAdminQRs()
      setQrs(data)
    } catch (error) {
      console.error('Error loading QRs:', error)
      toast.error('Error al cargar los codigos QR')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQRs()
  }, [])

  async function handleGenerate() {
    if (cantidad < 1 || cantidad > 100) {
      toast.error('La cantidad debe ser entre 1 y 100')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateAdminQRs(cantidad)
      toast.success(`${result.created} codigos QR generados`)
      setDialogOpen(false)
      setCantidad(1)
      loadQRs()
    } catch (error) {
      console.error('Error generating QRs:', error)
      toast.error('Error al generar codigos QR')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDelete(qrId: string) {
    try {
      await deleteAdminQR(qrId)
      toast.success('Codigo QR eliminado')
      setQrs(qrs.filter(qr => qr.id !== qrId))
    } catch (error) {
      console.error('Error deleting QR:', error)
      toast.error('Error al eliminar el codigo QR')
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Codigo copiado')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const availableQRs = qrs.filter(qr => !qr.mascota_id && qr.activo)
  const usedQRs = qrs.filter(qr => qr.mascota_id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Codigos QR</h1>
          <p className="text-muted-foreground">Gestiona los codigos QR del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generar QRs
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Codigos QR</DialogTitle>
              <DialogDescription>
                Los codigos generados estaran disponibles para que los usuarios los activen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad a generar</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min={1}
                  max={100}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  disabled={isGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  Maximo 100 codigos por vez
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isGenerating}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Spinner className="mr-2" /> : null}
                Generar {cantidad} {cantidad === 1 ? 'codigo' : 'codigos'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total QRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{qrs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{availableQRs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{usedQRs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* QR Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Codigos QR</CardTitle>
          <CardDescription>
            Todos los codigos QR generados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qrs.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin codigos QR</h3>
              <p className="text-muted-foreground mb-4">
                Genera tu primer lote de codigos QR
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generar QRs
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mascota</TableHead>
                    <TableHead>Dueno</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrs.map((qr) => (
                    <TableRow key={qr.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {qr.codigo}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyCode(qr.codigo)}
                          >
                            {copiedCode === qr.codigo ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {qr.mascota_id ? (
                          <Badge variant="default">En uso</Badge>
                        ) : qr.activo ? (
                          <Badge variant="secondary">Disponible</Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {qr.mascota_nombre ? (
                          <div className="flex items-center gap-2">
                            <PawPrint className="w-4 h-4 text-muted-foreground" />
                            {qr.mascota_nombre}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {qr.owner_name ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {qr.owner_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
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
                              <AlertDialogTitle>Eliminar codigo QR</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta accion no se puede deshacer. {qr.mascota_id && 'La mascota asociada perdera su codigo QR.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(qr.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
