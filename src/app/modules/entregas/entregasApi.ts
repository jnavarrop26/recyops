import { clienteApi } from "@/app/http/clienteApi";
import { normalizarPagina, type Pagina } from "@/app/http/paginacion";

export type EstadoEntrega = "RECIBIDA" | "EN_PROCESO" | "PROCESADA" | "DESPACHADA";

export interface LineaEntrega {
  tipoMaterialId: string;
  tipoMaterialNombre: string;
  pesoKg: number;
}

/** Encabezado de entrega — forma liviana que devuelve el listado (sin líneas). */
export interface Entrega {
  id: string;
  codigo: string;
  convenioId: string | null;
  convenioNombre: string | null;
  bodegaId: string;
  bodegaNombre: string;
  personaEntregaId: string | null;
  personaEntregaNombre: string | null;
  personaEntregaCedula: string | null;
  totalKg: number;
  estado: EstadoEntrega;
  fechaRecepcion: string;
  usuarioRegistroNombre: string;
  lineas: LineaEntrega[];
}

export type PaginaEntregas = Pagina<Entrega>;

export interface FiltrosEntregas {
  bodegaId?: string;
  convenioId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  size?: number;
}

export interface CuerpoLineaEntrega {
  tipoMaterialId: string;
  pesoKg: number;
}

export interface CuerpoEntrega {
  convenioId: string;
  bodegaId: string;
  personaEntregaId: string;
  fechaRecepcion: string | null;
  lineas: CuerpoLineaEntrega[];
}

export const ESTADOS_ENTREGA: EstadoEntrega[] = [
  "RECIBIDA",
  "EN_PROCESO",
  "PROCESADA",
  "DESPACHADA",
];

// Siguiente estado válido en el flujo, o null si es el último.
export function siguienteEstado(estado: EstadoEntrega): EstadoEntrega | null {
  const indice = ESTADOS_ENTREGA.indexOf(estado);
  return indice >= 0 && indice < ESTADOS_ENTREGA.length - 1 ? ESTADOS_ENTREGA[indice + 1] : null;
}

// GET /api/entregas
export async function listarEntregas(filtros: FiltrosEntregas = {}): Promise<PaginaEntregas> {
  const size = filtros.size ?? 20;
  const { data } = await clienteApi.get("/entregas", {
    params: {
      bodegaId: filtros.bodegaId || undefined,
      convenioId: filtros.convenioId || undefined,
      estado: filtros.estado || undefined,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<Entrega>(data, size);
}

// GET /api/entregas/{id} — trae las líneas de material.
export async function obtenerEntrega(id: string): Promise<Entrega> {
  const { data } = await clienteApi.get<Entrega>(`/entregas/${id}`);
  return data;
}

// POST /api/entregas
export async function registrarEntrega(cuerpo: CuerpoEntrega): Promise<Entrega> {
  const { data } = await clienteApi.post<Entrega>("/entregas", cuerpo);
  return data;
}

// PATCH /api/entregas/{id}/estado?valor=
export async function cambiarEstadoEntrega(id: string, valor: EstadoEntrega): Promise<Entrega> {
  const { data } = await clienteApi.patch<Entrega>(`/entregas/${id}/estado`, null, {
    params: { valor },
  });
  return data;
}

// DELETE /api/entregas/{id}
export async function eliminarEntrega(id: string): Promise<void> {
  await clienteApi.delete(`/entregas/${id}`);
}
