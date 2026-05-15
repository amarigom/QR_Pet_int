export interface Pet {
  id: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'otro';
  raza: string | null;
  color: string | null;
  edad_aproximada: string | null;
  foto_url: string | null;
  notas: string | null;
  estado: string;
  usuario_id: string;
  owner?: PetOwner; 
  created_at?: string;
}

export interface PetOwner {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
}

export type PetFormData = {
  nombre: string;
  especie: string;
  raza?: string | null;
  color?: string | null;
  edad_aproximada?: string | null;
  foto_url?: string | null;
  notas?: string | null;
};

export interface PaginatedPets {
  items: Pet[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}