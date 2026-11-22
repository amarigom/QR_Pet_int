"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileCode2,
  Upload,
  Eye,
  Download,
  Loader2,
  Calendar,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ClinicalStudy,
  ClinicalStudyWithAccess,
  TipoArchivoEstudio,
} from "../lib/types/clinical-study";
import {
  fetchPetStudies,
  fetchStudyAccessUrl,
  uploadClinicalStudy,
} from "@/lib/api/clinical-studies";

interface ClinicalStudiesSectionProps {
  petId: string;
  canUpload?: boolean;
}

const CATEGORIAS = ["Radiología", "Laboratorio", "Ecografía", "Cardiología", "Otro"];
const MAX_MB = 25;

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("access_token") ??
    localStorage.getItem("token") ??
    localStorage.getItem("petqr_token") ??
    ""
  );
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StudyIcon({ tipo }: { tipo: TipoArchivoEstudio }) {
  if (tipo === "PDF") return <FileText className="h-5 w-5 text-red-500" />;
  if (tipo === "IMAGE") return <ImageIcon className="h-5 w-5 text-sky-500" />;
  return <FileCode2 className="h-5 w-5 text-amber-500" />;
}

export function ClinicalStudiesSection({
  petId,
  canUpload = true,
}: ClinicalStudiesSectionProps) {
  const [studies, setStudies] = useState<ClinicalStudy[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Estados del modal de subida
  const [uploadOpen, setUploadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Laboratorio");
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [notas, setNotas] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados del visor prefirmado
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loadingViewerId, setLoadingViewerId] = useState<string | null>(null);
  const [activeStudy, setActiveStudy] = useState<ClinicalStudyWithAccess | null>(null);

  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    setLoadingList(true);

    fetchPetStudies(petId, token, filterCategory)
      .then((data) => {
        if (active) setStudies(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [petId, filterCategory]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError("Seleccioná un archivo PDF, DICOM o imagen.");
      return;
    }
    if (selectedFile.size > MAX_MB * 1024 * 1024) {
      setUploadError(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }

    const formData = new FormData();
    formData.append("mascota_id", petId);
    formData.append("titulo", titulo.trim());
    formData.append("categoria", categoria);
    if (solicitadoPor.trim()) {
      formData.append("solicitado_por", solicitadoPor.trim());
    }
    if (notas.trim()) {
      formData.append("notas_veterinario", notas.trim());
    }
    formData.append("file", selectedFile);

    try {
      setSubmitting(true);
      const token = getAuthToken();
      const created = await uploadClinicalStudy(formData, token);
      setStudies((prev) => [created, ...prev]);
      setTitulo("");
      setSolicitadoPor("");
      setNotas("");
      setSelectedFile(null);
      setUploadOpen(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error inesperado al subir.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenStudy(studyId: string) {
    try {
      setLoadingViewerId(studyId);
      const token = getAuthToken();
      const studyWithUrl = await fetchStudyAccessUrl(studyId, token);
      setActiveStudy(studyWithUrl);
      setViewerOpen(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo abrir el estudio clínico. Intentá nuevamente.");
    } finally {
      setLoadingViewerId(null);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Estudios Clínicos y Diagnóstico</CardTitle>
          <p className="text-sm text-muted-foreground">
            Análisis de laboratorio, radiografías, ecografías e informes médicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[155px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las áreas</SelectItem>
              {CATEGORIAS.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canUpload && (
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  Subir estudio
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adjuntar Estudio Clínico</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="titulo">Título del estudio *</Label>
                    <Input
                      id="titulo"
                      placeholder="Ej: Hemograma completo / Rx Tórax"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      required
                      minLength={2}
                      maxLength={150}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Categoría *</Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="solicitado-por">Solicitado por (opcional)</Label>
                      <Input
                        id="solicitado-por"
                        placeholder="Ej: Derivación Dr. Gómez"
                        value={solicitadoPor}
                        onChange={(e) => setSolicitadoPor(e.target.value)}
                        maxLength={120}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="archivo">Archivo (PDF, JPG, PNG, DICOM) *</Label>
                    <Input
                      id="archivo"
                      type="file"
                      accept=".pdf,.dcm,.dicom,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Tamaño máximo: {MAX_MB} MB.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notas">Observaciones / Informe breve</Label>
                    <Textarea
                      id="notas"
                      rows={3}
                      placeholder="Conclusiones o parámetros relevantes..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    />
                  </div>

                  {uploadError && (
                    <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
                      {uploadError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadOpen(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {submitting ? "Subiendo..." : "Guardar estudio"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loadingList ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando estudios...
          </div>
        ) : studies.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay estudios clínicos registrados para esta mascota.
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {studies.map((study) => (
              <div
                key={study.id}
                className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-muted p-2">
                    <StudyIcon tipo={study.tipo_archivo} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium leading-none">{study.titulo}</span>
                      <Badge variant="secondary">{study.categoria}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {study.tipo_archivo}
                      </Badge>
                      {study.solicitado_por && (
                        <Badge variant="outline" className="gap-1 text-xs font-normal">
                          <Stethoscope className="h-3 w-3" />
                          {study.solicitado_por}
                        </Badge>
                      )}
                    </div>

                    {study.notas_veterinario && (
                      <p className="text-sm text-muted-foreground">{study.notas_veterinario}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(study.fecha_estudio).toLocaleDateString("es-AR")}
                      </span>
                      <span>•</span>
                      <span>{formatBytes(study.tamano_bytes)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={loadingViewerId === study.id}
                  onClick={() => handleOpenStudy(study.id)}
                >
                  {loadingViewerId === study.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Ver archivo
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Visor de PDF / Imagen con URL Prefirmada */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-6">
            <div>
              <DialogTitle>{activeStudy?.titulo}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {activeStudy?.categoria}
                {activeStudy?.solicitado_por ? ` • ${activeStudy.solicitado_por}` : ""}
                {" • Enlace seguro válido por 15 minutos"}
              </p>
            </div>
            {activeStudy && (
              <Button asChild size="sm" variant="secondary" className="gap-1.5">
                <a href={activeStudy.access_url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4" />
                  Descargar
                </a>
              </Button>
            )}
          </DialogHeader>

          <div className="relative flex-1 overflow-hidden rounded-md border bg-muted/30">
            {activeStudy?.tipo_archivo === "PDF" && (
              <iframe
                src={activeStudy.access_url}
                title={activeStudy.titulo}
                className="h-full w-full border-0"
              />
            )}

            {activeStudy?.tipo_archivo === "IMAGE" && (
              <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
                <img
                  src={activeStudy.access_url}
                  alt={activeStudy.titulo}
                  className="max-h-full max-w-full rounded object-contain shadow-sm"
                />
              </div>
            )}

            {activeStudy?.tipo_archivo === "DICOM" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <FileCode2 className="h-12 w-12 text-amber-500" />
                <p className="font-medium">Archivo médico en formato DICOM (.dcm)</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Descargá el archivo original para abrirlo en tu visor radiológico o integrá el
                  visor web Cornerstone.js.
                </p>
                <Button asChild className="mt-2 gap-1.5">
                  <a href={activeStudy.access_url} download>
                    <Download className="h-4 w-4" />
                    Descargar archivo DICOM
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}