// Modelo para Red
export interface Red {
  id: number;
  nombre: string;
  created_at?: string;
  updated_at?: string;
}

// Modelo para IPRESS
export interface Ipress {
  id: number;
  red_id: number;
  nombre: string;
  red?: string; // Nombre de la red (join)
  created_at?: string;
  updated_at?: string;
}

// Modelo para Grupo Ocupacional
export interface GrupoOcupacional {
  id: number;
  nombre: string;
  created_at?: string;
  updated_at?: string;
}

// Modelo para Plaza
export interface Plaza {
  id: number;
  ipress_id: number;
  grupo_ocupacional_id: number;
  subunidad?: string; // Nueva columna
  especialidad: string;
  total: number;
  ipress?: string; // Nombre del IPRESS (join)
  grupo_ocupacional?: string; // Nombre del grupo (join)
  red?: string; // Nombre de la red (join)
  asignados?: number; // Calculado dinámicamente
  libres?: number; // Calculado dinámicamente
  created_at?: string;
  updated_at?: string;
}

// Modelo para Postulante
export interface Postulante {
  id: number;
  orden_merito: number;
  apellidos: string;
  nombres: string;
  grupo_ocupacional_id: number;
  grupo_ocupacional?: string; // Nombre del grupo (join)
  fecha_registro: string;
  created_at?: string;
  updated_at?: string;
}

// Estados posibles de adjudicación
export type EstadoAdjudicacion = 'pendiente' | 'adjudicado' | 'desistido' | 'renuncio' | 'ausente';

// Modelo para Adjudicación
export interface Adjudicacion {
  id: number;
  postulante_id: number;
  plaza_id: number | null;
  estado: EstadoAdjudicacion;
  fecha_adjudicacion: string | null;
  fecha_desistimiento: string | null;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  
  // Datos relacionados (joins)
  postulante?: Postulante;
  plaza?: Plaza;
}

// Modelo completo para la vista de postulantes con estado
export interface PostulanteConEstado {
  id: number;
  orden_merito: number;
  apellidos_nombres: string; // Concatenado en la vista
  apellidos: string;
  nombres: string;
  grupo_ocupacional_id: number;
  grupo_ocupacional: string;
  especialidad?: string; // Especialidad del postulante
  fecha_registro: string;
  estado: EstadoAdjudicacion;
  red_adjudicada?: string;
  ipress_adjudicada?: string;
  subunidad_adjudicada?: string;
  grupo_ocupacional_adjudicado?: string;
  especialidad_adjudicada?: string;
  fecha_adjudicacion?: string;
  fecha_desistimiento?: string;
  observaciones?: string;
}

// Modelo para plaza con disponibilidad
export interface PlazaConDisponibilidad {
  id: number;
  red_id: number;
  red: string;
  ipress_id: number;
  ipress: string;
  grupo_ocupacional_id: number;
  subunidad?: string;
  especialidad: string;
  total: number;
  asignados: number;
  libres: number;
}

// Respuesta de API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Filtros para las consultas
export interface FiltroPostulantes {
  grupoOcupacionalId?: number;
  estado?: EstadoAdjudicacion;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FiltroPlazas {
  redId?: number;
  ipressId?: number;
  grupoOcupacionalId?: number;
  soloDisponibles?: boolean;
  page?: number;
  limit?: number;
}

// Request para adjudicar
export interface RequestAdjudicar {
  postulanteId: number;
  plazaId: number;
  observaciones?: string;
}

// Request para desistir
export interface RequestDesistir {
  postulanteId: number;
  observaciones?: string;
}

// Request para renunciar
export interface RequestRenunciar {
  postulanteId: number;
  observaciones?: string;
}