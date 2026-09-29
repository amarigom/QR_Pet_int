// types/historiaClinica.ts

// 1. Datos comunes de la consulta
export interface HistoriaClinicaBase {
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
  peso_kg?: number | null;
  temperatura_c?: number | null;
  adjuntos?: any[] | null;
}

// 2. Payload para crear una nueva consulta (HistoriaClinicaCreate)
export interface HistoriaClinicaCreate extends HistoriaClinicaBase {
  mascota_id: string;
}

// 3. Payload para actualización parcial (HistoriaClinicaUpdate)
export interface HistoriaClinicaUpdate {
  motivo_consulta?: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
  peso_kg?: number | null;
  temperatura_c?: number | null;
  adjuntos?: any[] | null;
}

// 4. Respuesta serializada desde la BD (HistoriaClinicaResponse)
export interface HistoriaClinica extends HistoriaClinicaBase {
  id: string;
  veterinario_id: string;
  mascota_id: string;
  fecha_consulta: string; // ISO String UTC desde PostgreSQL
  created_at: string;     // ISO String UTC

  // Relación opcional si en SQLAlchemy hacés eager loading del veterinario
  veterinario?: {
    id: string;
    nombre: string;
    matricula?: string | null;
  };
}

// 5. Auxiliar si traés el historial completo paginado o listado por mascota
export interface PaginatedHistoriasClinicas {
  items: HistoriaClinica[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}