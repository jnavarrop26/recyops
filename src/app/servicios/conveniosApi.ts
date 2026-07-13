import { clienteApi } from "./clienteApi";

export type EstadoConvenio = "ACTIVO" | "INACTIVO" | "VENCIDO" | "SUSPENDIDO";
export type TipoConvenio = "COMPRA" | "VENTA" | "INTERCAMBIO" | "SERVICIO";

export interface Convenio {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoConvenio;
  proveedorId: string | null;
  proveedorNombre: string | null;
  bodegaId: string | null;
  bodegaNombre: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  valorTotal: number | null;
  responsable: string | null;
  descripcion: string | null;
  estado: EstadoConvenio;
  fechaCreacion: string;
}

export interface PaginaConvenios {
  content: Convenio[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FiltrosConvenios {
  estado?: string;
  tipo?: string;
  nombre?: string;
  page?: number;
  size?: number;
}

export interface CuerpoConvenio {
  nombre: string;
  tipo: TipoConvenio;
  proveedorId: string | null;
  bodegaId: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  valorTotal: number | null;
  responsable: string | null;
  descripcion: string | null;
}

export const ESTADOS_CONVENIO: EstadoConvenio[] = ["ACTIVO", "INACTIVO", "VENCIDO", "SUSPENDIDO"];
export const TIPOS_CONVENIO: TipoConvenio[] = ["COMPRA", "VENTA", "INTERCAMBIO", "SERVICIO"];

// GET /api/convenios
export async function listarConvenios(filtros: FiltrosConvenios = {}): Promise<PaginaConvenios> {
  const { data } = await clienteApi.get("/convenios", {
    params: {
      estado: filtros.estado || undefined,
      tipo: filtros.tipo || undefined,
      nombre: filtros.nombre || undefined,
      page: filtros.page ?? 0,
      size: filtros.size ?? 20,
    },
  });
  if (Array.isArray(data)) {
    return { content: data, totalElements: data.length, totalPages: 1, number: 0, size: data.length };
  }
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    number: data?.number ?? 0,
    size: data?.size ?? (filtros.size ?? 20),
  };
}

// GET /api/convenios/{id}
export async function obtenerConvenio(id: string): Promise<Convenio> {
  const { data } = await clienteApi.get<Convenio>(`/convenios/${id}`);
  return data;
}

// POST /api/convenios
export async function crearConvenio(cuerpo: CuerpoConvenio): Promise<Convenio> {
  const { data } = await clienteApi.post<Convenio>("/convenios", cuerpo);
  return data;
}

// PUT /api/convenios/{id}
export async function actualizarConvenio(id: string, cuerpo: CuerpoConvenio): Promise<Convenio> {
  const { data } = await clienteApi.put<Convenio>(`/convenios/${id}`, cuerpo);
  return data;
}

// PATCH /api/convenios/{id}/estado?valor=
export async function cambiarEstadoConvenio(
  id: string,
  valor: EstadoConvenio,
): Promise<Convenio> {
  const { data } = await clienteApi.patch<Convenio>(`/convenios/${id}/estado`, null, {
    params: { valor },
  });
  return data;
}
