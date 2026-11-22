export type TipoArchivoEstudio = "PDF" | "DICOM" | "IMAGE";

export interface ClinicalStudy {
  id: string;
  mascota_id: string;
  veterinario_id?: string | null;
  solicitado_por?: string | null;
  titulo: string;
  categoria: string;
  tipo_archivo: TipoArchivoEstudio;
  tamano_bytes: number | null;
  notas_veterinario: string | null;
  fecha_estudio: string;
  created_at: string;
}

export interface ClinicalStudyWithAccess extends ClinicalStudy {
  access_url: string;
  expires_in_seconds: number;
}