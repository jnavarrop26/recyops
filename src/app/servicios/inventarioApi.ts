import { clienteApi } from "./clienteApi";

export type TipoOperacion = "ENTRADA" | "SALIDA" | "AJUSTE" | "MERMA" | "TRANSFORMACION";

export interface LineaInventario {
  id: string;
  bodegaId: string;
  bodegaNombre: string;
  tipoMaterialId: string;
  tipoMaterialNombre: string;
  categoriaNombre: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  bajoMinimo: boolean;
  fechaActualizacion: string;
}

export interface MovimientoInventario {
  id: string;
  tipoOperacion: TipoOperacion;
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  referencia: string | null;
  usuarioNombre: string;
  fechaRegistro: string;
}

export interface PaginaInventario {
  content: LineaInventario[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PaginaMovimientos {
  content: MovimientoInventario[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FiltrosInventario {
  bodegaId: string;
  tipoMaterialId?: string;
  bajoMinimo?: string;
  page?: number;
  size?: number;
}

export interface CuerpoCrearLinea {
  bodegaId: string;
  tipoMaterialId: string;
  stockMinimo: number;
  stockMaximo: number;
}

export interface CuerpoTopes {
  stockMinimo: number;
  stockMaximo: number;
}

export interface CuerpoAjuste {
  cantidadNueva: number;
  motivo: string;
}

export interface CuerpoMerma {
  cantidad: number;
  motivo: string;
}

function normalizarPagina<T>(data: any, size: number) {
  if (Array.isArray(data)) {
    return { content: data as T[], totalElements: data.length, totalPages: 1, number: 0, size: data.length };
  }
  return {
    content: (Array.isArray(data?.content) ? data.content : []) as T[],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    number: data?.number ?? 0,
    size: data?.size ?? size,
  };
}

// GET /api/inventario?bodegaId=
export async function listarInventario(filtros: FiltrosInventario): Promise<PaginaInventario> {
  const size = filtros.size ?? 20;
  const { data } = await clienteApi.get("/inventario", {
    params: {
      bodegaId: filtros.bodegaId,
      tipoMaterialId: filtros.tipoMaterialId || undefined,
      bajoMinimo: filtros.bajoMinimo || undefined,
      page: filtros.page ?? 0,
      size,
    },
  });
  return normalizarPagina<LineaInventario>(data, size);
}

// GET /api/inventario/{id}
export async function obtenerLinea(id: string): Promise<LineaInventario> {
  const { data } = await clienteApi.get<LineaInventario>(`/inventario/${id}`);
  return data;
}

// GET /api/inventario/{id}/movimientos
export async function obtenerMovimientos(
  id: string,
  page = 0,
  size = 20,
): Promise<PaginaMovimientos> {
  const { data } = await clienteApi.get(`/inventario/${id}/movimientos`, {
    params: { page, size },
  });
  return normalizarPagina<MovimientoInventario>(data, size);
}

// POST /api/inventario
export async function crearLinea(cuerpo: CuerpoCrearLinea): Promise<LineaInventario> {
  const { data } = await clienteApi.post<LineaInventario>("/inventario", cuerpo);
  return data;
}

// PUT /api/inventario/{id}
export async function actualizarTopes(id: string, cuerpo: CuerpoTopes): Promise<LineaInventario> {
  const { data } = await clienteApi.put<LineaInventario>(`/inventario/${id}`, cuerpo);
  return data;
}

// POST /api/inventario/{id}/ajuste
export async function registrarAjuste(id: string, cuerpo: CuerpoAjuste): Promise<LineaInventario> {
  const { data } = await clienteApi.post<LineaInventario>(`/inventario/${id}/ajuste`, cuerpo);
  return data;
}

// POST /api/inventario/{id}/merma
export async function registrarMerma(id: string, cuerpo: CuerpoMerma): Promise<LineaInventario> {
  const { data } = await clienteApi.post<LineaInventario>(`/inventario/${id}/merma`, cuerpo);
  return data;
}
