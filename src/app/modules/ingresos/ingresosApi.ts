import { clienteApi } from "@/app/http/clienteApi";
import { normalizarPagina, type Pagina } from "@/app/http/paginacion";

// Un material dentro de un ingreso (detalle de bascula).
export interface DetalleIngreso {
  id: string;
  // FK al catálogo de materiales; null en ingresos históricos (texto libre)
  materialId: string | null;
  categoria: string;
  pesoBruto: number;
  tara: number;
  pesoNeto: number;
  precioKilo: number;
  subtotal: number;
  observaciones: string | null;
}

// Estado de pago del ingreso, independiente del flujo operativo del lote.
export type EstadoPago = "POR_PAGAR" | "PAGADO";

// Medio con el que se pagó el ingreso; solo llega cuando ya está pagado.
export const METODOS_PAGO = ["EFECTIVO", "TRANSFERENCIA"] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

// Guarda de tipo para valores que llegan de controles del DOM.
export function esMetodoPago(valor: string): valor is MetodoPago {
  return (METODOS_PAGO as readonly string[]).includes(valor);
}

// Estado operativo del lote ingresado (espejo de EstadoIngreso del backend).
export const ESTADOS_INGRESO = ["POR_CLASIFICAR", "EN_BODEGA", "DESPACHADO", "RECHAZADO"] as const;
export type EstadoIngreso = (typeof ESTADOS_INGRESO)[number];

export const ETIQUETA_ESTADO_INGRESO: Record<EstadoIngreso, string> = {
  POR_CLASIFICAR: "Por clasificar",
  EN_BODEGA: "En bodega",
  DESPACHADO: "Despachado",
  RECHAZADO: "Rechazado",
};

// Guarda de tipo: el backend serializa el estado como string plano.
export function esEstadoIngreso(valor: string): valor is EstadoIngreso {
  return (ESTADOS_INGRESO as readonly string[]).includes(valor);
}

// Estructura de un ingreso devuelto por el backend.
export interface Ingreso {
  id: number;
  // Codigo universal del recibo; se imprime junto al folio REC-XXXXXX
  uuid: string;
  fecha: string; // ISO: 2026-06-13T10:30:00
  cliente: string;
  cedula: string;
  bodegaDestino: string;
  encargado: string;
  placaVehiculo: string;
  pesoNetoTotal: number;
  total: number;
  estado: EstadoIngreso;
  estadoPago: EstadoPago;
  metodoPago: MetodoPago | null;
  // Marca operativa editable desde el historial: si el lote ya pasó o no.
  paso: boolean;
  // Solo viene completo en GET /api/ingresos/{id}; en el historial llega vacio
  detalles: DetalleIngreso[];
}

export interface FiltrosHistorial {
  fechaDesde?: string; // formato YYYY-MM-DD
  fechaHasta?: string; // formato YYYY-MM-DD
  page?: number;
  size?: number;
}

export type PaginaIngresos = Pagina<Ingreso>;

// GET /api/ingresos?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD&page=&size=
export async function obtenerHistorialIngresos(
  filtros: FiltrosHistorial = {},
): Promise<PaginaIngresos> {
  const size = filtros.size ?? 50;
  const { data } = await clienteApi.get("/ingresos", {
    params: {
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<Ingreso>(data, size);
}

// GET /api/ingresos/{id}
export async function obtenerIngresoPorId(id: number): Promise<Ingreso> {
  const respuesta = await clienteApi.get<Ingreso>(`/ingresos/${id}`);
  return respuesta.data;
}

// GET /api/ingresos/uuid/{uuid} — identificador público no enumerable
export async function obtenerIngresoPorUuid(uuid: string): Promise<Ingreso> {
  const respuesta = await clienteApi.get<Ingreso>(`/ingresos/uuid/${uuid}`);
  return respuesta.data;
}

export interface CuerpoDetalleIngreso {
  // El backend resuelve categoría y precio base desde el catálogo.
  materialId: string;
  pesoBruto: number;
  tara: number;
  precioKilo: number;
  observaciones: string | null;
}

// Cuerpo que espera el backend para registrar un ingreso en báscula.
// El backend siempre recalcula pesoNetoTotal y total desde los materiales, y
// cada uno alimenta el inventario de la bodega destino (InventarioService.
// registrarEntrada) — bodegaDestinoId y materialId son obligatorios.
export interface CuerpoIngreso {
  cliente: string;
  cedula: string;
  bodegaDestinoId: string;
  encargado: string;
  placaVehiculo: string | null;
  pesoNetoTotal: number;
  total: number;
  materiales: CuerpoDetalleIngreso[];
}

// POST /api/ingresos
export async function registrarIngreso(cuerpo: CuerpoIngreso): Promise<Ingreso> {
  const respuesta = await clienteApi.post<Ingreso>("/ingresos", cuerpo);
  return respuesta.data;
}

// PATCH /api/ingresos/{id}/pago — marca el ingreso como pagado, o corrige
// el método si ya estaba pagado (solo ADMIN)
export async function registrarPagoIngreso(
  id: number,
  metodoPago: MetodoPago,
): Promise<Ingreso> {
  const respuesta = await clienteApi.patch<Ingreso>(`/ingresos/${id}/pago`, { metodoPago });
  return respuesta.data;
}

// PATCH /api/ingresos/{id}/estado?valor=... — cambia el estado del lote (solo ADMIN)
export async function cambiarEstadoIngreso(
  id: number,
  valor: EstadoIngreso,
): Promise<Ingreso> {
  const respuesta = await clienteApi.patch<Ingreso>(`/ingresos/${id}/estado`, null, {
    params: { valor },
  });
  return respuesta.data;
}

// PATCH /api/ingresos/{id}/paso?valor=true|false — marca si el lote pasó (solo ADMIN)
export async function cambiarPasoIngreso(id: number, valor: boolean): Promise<Ingreso> {
  const respuesta = await clienteApi.patch<Ingreso>(`/ingresos/${id}/paso`, null, {
    params: { valor },
  });
  return respuesta.data;
}
