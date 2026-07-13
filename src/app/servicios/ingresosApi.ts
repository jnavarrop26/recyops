import { clienteApi } from "./clienteApi";

// Un material dentro de un ingreso (detalle de bascula).
export interface DetalleIngreso {
  id: string;
  categoria: string;
  pesoBruto: number;
  tara: number;
  pesoNeto: number;
  precioKilo: number;
  subtotal: number;
  observaciones: string | null;
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
  estado: string;
  // Solo viene completo en GET /api/ingresos/{id}; en el historial llega vacio
  detalles: DetalleIngreso[];
}

export interface FiltrosHistorial {
  fechaDesde?: string; // formato YYYY-MM-DD
  fechaHasta?: string; // formato YYYY-MM-DD
}

// GET /api/ingresos?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
export async function obtenerHistorialIngresos(
  filtros: FiltrosHistorial = {},
): Promise<Ingreso[]> {
  const respuesta = await clienteApi.get("/ingresos", {
    params: {
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
    },
  });
  const datos = respuesta.data;
  // Soporta tanto un arreglo directo como una respuesta paginada de Spring ({ content: [...] }).
  if (Array.isArray(datos)) return datos;
  if (datos && Array.isArray(datos.content)) return datos.content;
  return [];
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
  categoria: string;
  pesoBruto: number;
  tara: number;
  precioKilo: number;
  observaciones: string | null;
}

// Cuerpo que espera el backend para registrar un ingreso en báscula.
// Si van materiales, el backend recalcula pesoNetoTotal y total desde ellos.
export interface CuerpoIngreso {
  cliente: string;
  cedula: string;
  bodegaDestino: string;
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
