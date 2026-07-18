
import { clienteApi } from "@/app/http/clienteApi";
import { normalizarPagina, type Pagina } from "@/app/http/paginacion";

export type EstadoBodega = "ACTIVA" | "INACTIVA" | "MANTENIMIENTO";

export interface Bodega {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  nit: string;
  latitud: number | null;
  longitud: number | null;
  tipoOrganizacion: string;
  estado: EstadoBodega;
  fechaCreacion: string;
}

export type PaginaBodegas = Pagina<Bodega>;

export interface FiltrosBodegas {
  estado?: string;
  tipoOrganizacion?: string;
  nombre?: string;
  page?: number;
  size?: number;
}

export interface CuerpoBodega {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  nit: string;
  latitud: number | null;
  longitud: number | null;
  tipoOrganizacion: string;
}

export interface UsuarioBodega {
  id: string;
  nombreCompleto: string;
  username: string;
  rol: string;
  estado: string;
}

export const ESTADOS_BODEGA: EstadoBodega[] = ["ACTIVA", "INACTIVA", "MANTENIMIENTO"];
export const TIPOS_ORGANIZACION = ["PROPIA", "ALIADA", "TERCERIZADA"];

// GET /api/bodegas
export async function listarBodegas(filtros: FiltrosBodegas = {}): Promise<PaginaBodegas> {
  const size = filtros.size ?? 20;
  const { data } = await clienteApi.get("/bodegas", {
    params: {
      estado: filtros.estado || undefined,
      tipoOrganizacion: filtros.tipoOrganizacion || undefined,
      nombre: filtros.nombre || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<Bodega>(data, size);
}

// GET /api/bodegas/{id}
export async function obtenerBodega(id: string): Promise<Bodega> {
  const { data } = await clienteApi.get<Bodega>(`/bodegas/${id}`);
  return data;
}

// GET /api/bodegas/{id}/usuarios
export async function obtenerUsuariosBodega(id: string): Promise<UsuarioBodega[]> {
  const { data } = await clienteApi.get(`/bodegas/${id}/usuarios`);
  return Array.isArray(data) ? data : [];
}

// POST /api/bodegas
export async function crearBodega(cuerpo: CuerpoBodega): Promise<Bodega> {
  const { data } = await clienteApi.post<Bodega>("/bodegas", cuerpo);
  return data;
}

// PUT /api/bodegas/{id}
export async function actualizarBodega(id: string, cuerpo: CuerpoBodega): Promise<Bodega> {
  const { data } = await clienteApi.put<Bodega>(`/bodegas/${id}`, cuerpo);
  return data;
}

// PATCH /api/bodegas/{id}/estado?valor=
export async function cambiarEstadoBodega(id: string, valor: EstadoBodega): Promise<Bodega> {
  const { data } = await clienteApi.patch<Bodega>(`/bodegas/${id}/estado`, null, {
    params: { valor },
  });
  return data;
}
