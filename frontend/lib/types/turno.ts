

export type EstadoTurno = 'PROGRAMADO' | 'ATENDIDO' | 'CANCELADO';

export interface TurnoBase {
  mascota_id: string;
  dueno_id?: string | null;
  fecha_hora_inicio: string; // ISO String UTC
  fecha_hora_fin: string;    // ISO String UTC
  tipo_servicio: string;
  observaciones?: string | null;
}

// Payload para POST /turnos (TurnoCreate)
export interface TurnoCreate extends TurnoBase {}

// Payload para actualizar estado (TurnoUpdateEstado)
export interface TurnoUpdateEstado {
  nuevo_estado: EstadoTurno;
  observaciones?: string | null;
}

// Respuesta completa desde la API (TurnoResponse)
export interface Turno {
  id: string;
  veterinario_id: string;
  mascota_id: string;
  dueno_id?: string | null;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  tipo_servicio: string;
  estado: EstadoTurno;
  observaciones?: string | null;
  recordatorio_enviado: boolean;
  created_at: string;
  
  // Opcionales por si en la query hacés Eager Loading con SQLAlchemy:
  mascota?: {
    id: string;
    nombre: string;
    especie: string;
  };
  dueno?: {
    id: string;
    nombre: string;
    email?: string;
  };
}