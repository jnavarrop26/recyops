import { clienteApi } from "@/app/http/clienteApi";
import { normalizarPagina, type Pagina } from "@/app/http/paginacion";

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

export type PaginaConvenios = Pagina<Convenio>;

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
  const size = filtros.size ?? 20;
  const { data } = await clienteApi.get("/convenios", {
    params: {
      estado: filtros.estado || undefined,
      tipo: filtros.tipo || undefined,
      nombre: filtros.nombre || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<Convenio>(data, size);
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
