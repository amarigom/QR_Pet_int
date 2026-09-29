// 1. Datos del perfil profesional (PerfilVeterinarioCreate)
export interface PerfilVeterinarioCreate {
  nombre_clinica: string;
  matricula: string;
  especialidad?: string | null;
  direccion_consultorio?: string | null;
  telefono_agenda?: string | null;
}

// 2. Payload completo para el registro del profesional (RegistroVeterinarioCreate)
export interface RegistroVeterinarioCreate {
  email: string;
  password: string;
  nombre: string;
  telefono?: string | null;
  perfil: PerfilVeterinarioCreate;
}

// 3. Perfil del veterinario guardado en la BD (PerfilVeterinarioResponse)
export interface PerfilVeterinario extends PerfilVeterinarioCreate {
  id: string;
  user_id: string;
  activo: boolean;
  created_at: string; // ISO String UTC
}

// 4. Respuesta completa del endpoint de registro/auth (AuthVeterinarioRegisterResponse)
export interface AuthVeterinarioRegisterResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    created_at: string;
  };
  perfil: PerfilVeterinario;
}