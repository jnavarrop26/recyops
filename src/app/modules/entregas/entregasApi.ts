import { clienteApi } from "@/app/http/clienteApi";
import { normalizarPagina, type Pagina } from "@/app/http/paginacion";

export type EstadoEntrega = "RECIBIDA" | "EN_PROCESO" | "PROCESADA" | "DESPACHADA";

export interface Entrega {
  id: string;
  codigo: string;
  proveedorId: string;
  proveedorNombre: string;
  bodegaId: string;
  bodegaNombre: string;
  tipoMaterialId: string;
  tipoMaterialNombre: string;
  pesoKg: number;
  personaEntrega: string | null;
  estado: EstadoEntrega;
  fechaRecepcion: string;
  usuarioRegistroNombre: string;
}

export type PaginaEntregas = Pagina<Entrega>;

export interface FiltrosEntregas {
  bodegaId?: string;
  proveedorId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  size?: number;
}

export interface CuerpoEntrega {
  proveedorId: string;
  bodegaId: string;
  tipoMaterialId: string;
  pesoKg: number;
  personaEntrega: string | null;
  fechaRecepcion: string | null;
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
      proveedorId: filtros.proveedorId || undefined,
      estado: filtros.estado || undefined,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<Entrega>(data, size);
}

// GET /api/entregas/{id}
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

// GET /api/entregas/{id}/recibo -> PDF
export async function abrirReciboEntrega(id: string): Promise<void> {
  const respuesta = await clienteApi.get(`/entregas/${id}/recibo`, { responseType: "blob" });
  const url = URL.createObjectURL(respuesta.data);
  window.open(url, "_blank");
  // Libera la URL después de un momento para no acumular memoria.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
