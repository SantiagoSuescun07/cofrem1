// types/pqrs.ts

export interface PqrsItem {
  id: string;
  numero_radicado: string;
  fecha_radicacion: string; // formato YYYY-MM-DD
  tipo: string;
  asunto: string;
  estado: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PqrsResponse {
  pqrs: PqrsItem[];
  pagination: Pagination;
}
