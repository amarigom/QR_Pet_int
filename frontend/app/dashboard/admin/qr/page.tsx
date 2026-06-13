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
import { Plus, Trash2, ShieldCheck, ShieldAlert, Layers, Printer, Home, HeartCrack, CheckCircle } from 'lucide-react' 
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin' 
import { formatDateTime } from '@/lib/utils'
import type { AdminQR } from '@/lib/types/admin'

// 🎨 Mapeo de estilos y componentes visuales según el estado extendido de la mascota
const ESTADOS_MASCOTA = {
  libre: { label: 'Libre', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: CheckCircle },
  activo: { label: 'Activo', color: 'bg-green-100 text-green-800 border-green-200', icon: ShieldCheck },
  en_casa: { label: 'En Casa', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Home },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-800 border-red-200', icon: HeartCrack },
}

export default function AdminQRPage() {
  const [qrs, setQrs] = useState<AdminQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [lote, setLote] = useState('') 
  const [lotePdf, setLotePdf] = useState('') 
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false) 
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

  // Acción de alternar estado (Mantenemos la firma pero adaptada internamente si cambia la lógica)
  async function handleToggleStatus(codigo: string, currentStatus: boolean) {
    setIsUpdatingStatus(codigo)
    try {
      const nuevoEstado = !currentStatus; 
      await adminApi.toggleQRStatus(codigo); 
      toast.success(`Código ${codigo} ${nuevoEstado ? 'activado' : 'desactivado'}`);
      
      setQrs(prev => prev.map(qr => qr.codigo === codigo ? { ...qr, activo: nuevoEstado } : qr));
    } catch (error) {
      toast.error('Error al cambiar el estado del QR');
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  // 2. Generar usando adminApi.generateQRs adaptado a lotes
  async function handleGenerate() {
    if (cantidad < 1 || cantidad > 100) {
      toast.error('Cantidad inválida (1-100)')
      return
    }
    if (!lote.trim()) {
      toast.error('Por favor, ingresá un identificador de lote')
      return
    }

    setIsGenerating(true)
    try {
      const result = await adminApi.generateQRs(cantidad, lote.trim())
      toast.success(`${result.created} códigos generados para el lote ${lote}`)
      setLote('') 
      setCantidad(1) 
      setDialogOpen(false)
      loadQRs() 
    } catch (error) {
      toast.error('Error al generar el lote');
    } finally {
      setIsGenerating(false)
    }
  }

  // 3. Descargar Plantilla PDF mediante stream binario seguro
  async function handleDownloadPDF() {
    if (!lotePdf.trim()) {
      toast.error('Por favor, ingresá el nombre del lote a exportar')
      return
    }

    setIsDownloadingPdf(true)
    try {
      const blob = await adminApi.downloadLotePdf(lotePdf.trim());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lote_Impresion_${lotePdf.trim().toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Descarga del lote ${lotePdf} completada con éxito`);
      setLotePdf('');
      setPdfDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error de autenticación o el lote indicado no existe');
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Helper de QA para resolver dinámicamente qué estado renderizar
  function getQrEstado(qr: AdminQR) {
    if (!qr.mascota) return 'libre'
    // Si la mascota tiene un campo estado, lo usamos. Si no, resolvemos por fallback activo
    return qr.mascota.estado || (qr.activo ? 'activo' : 'libre')
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-80 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de QRs</h1>

        <div className="flex items-center gap-2">
          
          {/* Modal para Imprimir Lote PDF */}
          <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-secondary text-secondary-foreground hover:bg-secondary/15 font-medium transition-all"
              >
                <Printer className="w-4 h-4 mr-2 text-secondary-foreground/80" /> Imprimir Lote (PDF)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Descargar Plantilla de Impresión</DialogTitle>
                <DialogDescription>
                  Ingresá el identificador del lote para empaquetar todas las medallas en una grilla A4.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-2">
                <Label htmlFor="lote-pdf-input">Identificador del Lote Existente</Label>
                <Input
                  id="lote-pdf-input"
                  type="text"
                  placeholder="Ej: LOTE-MAYO-2026"
                  className="focus-visible:ring-secondary"
                  value={lotePdf}
                  onChange={(e) => setLotePdf(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleDownloadPDF} 
                  disabled={isDownloadingPdf} 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium"
                >
                  {isDownloadingPdf && <Spinner className="mr-2" />} Obtener PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para Generar Lote */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Generar Lote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Nuevos QRs por Lote</DialogTitle>
                <DialogDescription>
                  Indica el identificador de producción y cuántas medallas se van a fabricar.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lote-input">Identificador del Lote</Label>
                  <Input
                    id="lote-input"
                    type="text"
                    placeholder="Ej: LOTE-01 o MARZO-2026"
                    className="focus-visible:ring-primary"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad-input">Cantidad (Máx. 100)</Label>
                  <Input
                    id="cantidad-input"
                    type="number"
                    min={1}
                    max={100}
                    className="focus-visible:ring-primary"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  {isGenerating && <Spinner className="mr-2" />} Generar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Asignación</TableHead>
                <TableHead className="text-center">Estado del Sistema</TableHead>
                <TableHead>Mascota</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrs.map((qr) => {
                // Obtenemos los detalles específicos del estado actual
                const estadoClave = getQrEstado(qr) as keyof typeof ESTADOS_MASCOTA;
                const configEstado = ESTADOS_MASCOTA[estadoClave] || ESTADOS_MASCOTA.libre;
                const IconoEstado = configEstado.icon;

                return (
                  <TableRow key={qr.id}>
                    <TableCell className="font-mono text-xs font-semibold">{qr.codigo}</TableCell>

                    <TableCell>
                      {qr.lote ? (
                        <div className="flex items-center text-xs text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded border border-border">
                          <Layers className="w-3 h-3 mr-1 text-muted-foreground/80" />
                          <span className="font-medium text-foreground/80">{qr.lote}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Sin lote</span>
                      )}
                    </TableCell>

                    {/* Badge de Disponibilidad de la Medalla */}
                    <TableCell>
                      <Badge variant={qr.mascota ? "default" : "secondary"}>
                        {qr.mascota ? "Vinculado" : "Libre"}
                      </Badge>
                    </TableCell>

                    {/* 🎯 ACÁ ESTÁ EL CAMBIO PRINCIPAL: Render dinámico multiestado */}
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`${configEstado.color} border font-medium h-7 px-3 rounded-full transition-all`}
                        disabled={isUpdatingStatus === qr.codigo || !qr.mascota}
                        onClick={() => handleToggleStatus(qr.codigo, !!qr.activo)}
                        title={qr.mascota ? "Cambiar estado de la placa" : "Falta vincular mascota"}
                      >
                        {isUpdatingStatus === qr.codigo ? (
                          <Spinner className="w-3 h-3 mr-1" />
                        ) : (
                          <IconoEstado className={`w-3 h-3 mr-1 ${estadoClave === 'perdido' ? 'animate-bounce' : ''}`} />
                        )}
                        {configEstado.label}
                      </Button>
                    </TableCell>

                    <TableCell>{qr.mascota ? qr.mascota.nombre : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>{qr.mascota?.owner ? qr.mascota.owner.nombre : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(qr.created_at)}</TableCell>

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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}