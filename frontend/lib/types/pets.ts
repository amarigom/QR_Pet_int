// 1. El reflejo exacto de tu tabla 'mascotas' en la base de datos

export interface QrCode {
  id: string;
  codigo: string;
  mascota_id?: string | null;
  activo: boolean;
  lote?: string | null;
  created_at?: string;
}
export interface Pet {
  id: string;
  usuario_id: string;
  nombre: string;
  especie: string;          // ➔ ¡Ya no va a ser undefined!
  raza?: string | null;
  color?: string | null;
  edad_aproximada?: string | null;
  foto_url?: string | null;
  notas?: string | null;
  estado: 'en_casa' | 'perdido' | 'libre' | string; // Aseguramos los estados reales
  created_at: string;
  updated_at?: string;
  
  // Relaciones que vimos en tu query de SQLAlchemy
  owner?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    created_at: string;
  };
  qr_code?: QrCode | null;
  scans?: any[]; // Cambiar por la interfaz de scans si la tenés
}

// 2. Lo que el backend espera recibir en el PUT / POST (esquema Pydantic)
export interface PetFormData {
  nombre: string;
  especie: string;
  raza?:string |null;          // ➔ Obligatorio y correcto
  color?: string | null;
  edad_aproximada?: string | null;
  foto_url?: string | null;
  notas?: string | null;
  estado: string;
}
export interface PetOwner {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
}



export interface PaginatedPets {
  items: Pet[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}