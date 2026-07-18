import { clienteApi } from "@/app/http/clienteApi";
import { normalizarPagina, type Pagina } from "@/app/http/paginacion";

export type EstadoProveedor = "ACTIVO" | "INACTIVO" | "BLOQUEADO";

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  calificacion: number;
  estado: EstadoProveedor;
  fechaCreacion: string;
}

export type PaginaProveedores = Pagina<Proveedor>;

export interface FiltrosProveedores {
  estado?: string;
  nombre?: string;
  calificacionMin?: string;
  page?: number;
  size?: number;
}

export interface CuerpoProveedor {
  nombre: string;
  nit: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

export interface EntregaProveedor {
  id: string;
  codigo: string;
  tipoMaterialNombre: string;
  pesoKg: number;
  estado: string;
  fechaRecepcion: string;
}

export const ESTADOS_PROVEEDOR: EstadoProveedor[] = ["ACTIVO", "INACTIVO", "BLOQUEADO"];

// GET /api/proveedores
export async function listarProveedores(
  filtros: FiltrosProveedores = {},
): Promise<PaginaProveedores> {
  const size = filtros.size ?? 20;
  const { data } = await clienteApi.get("/proveedores", {
    params: {
      estado: filtros.estado || undefined,
      nombre: filtros.nombre || undefined,
      calificacionMin: filtros.calificacionMin || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<Proveedor>(data, size);
}

// POST /api/proveedores
export async function crearProveedor(cuerpo: CuerpoProveedor): Promise<Proveedor> {
  const { data } = await clienteApi.post<Proveedor>("/proveedores", cuerpo);
  return data;
}

// PUT /api/proveedores/{id}
export async function actualizarProveedor(
  id: string,
  cuerpo: CuerpoProveedor,
): Promise<Proveedor> {
  const { data } = await clienteApi.put<Proveedor>(`/proveedores/${id}`, cuerpo);
  return data;
}

// PATCH /api/proveedores/{id}/estado?valor=
export async function cambiarEstadoProveedor(
  id: string,
  valor: EstadoProveedor,
): Promise<Proveedor> {
  const { data } = await clienteApi.patch<Proveedor>(`/proveedores/${id}/estado`, null, {
    params: { valor },
  });
  return data;
}

// PATCH /api/proveedores/{id}/calificacion?valor=
export async function calificarProveedor(id: string, valor: number): Promise<Proveedor> {
  const { data } = await clienteApi.patch<Proveedor>(`/proveedores/${id}/calificacion`, null, {
    params: { valor },
  });
  return data;
}

// GET /api/proveedores/{id}/entregas
export async function obtenerEntregasProveedor(id: string): Promise<EntregaProveedor[]> {
  const { data } = await clienteApi.get(`/proveedores/${id}/entregas`);
  return Array.isArray(data) ? data : [];
}
