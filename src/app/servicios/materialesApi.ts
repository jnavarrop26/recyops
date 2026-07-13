import { clienteApi } from "./clienteApi";

export interface Material {
  id: string;
  nombre: string;
  categoriaCodigo: string;
  categoriaNombre: string;
  subcategoriaCodigo: string | null;
  subcategoriaNombre: string | null;
  resinaCodigo: string | null;
  resinaNombre: string | null;
  colorCodigo: string | null;
  colorNombre: string | null;
  unidadMedida: string;
  unidadEmpaque: string;
  precioBase: number;
  factorCalidad: number;
  umbralMerma: number | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface PaginaMateriales {
  content: Material[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FiltrosMateriales {
  categoria?: string;
  resina?: string;
  color?: string;
  empaque?: string;
  activo?: string;
  page?: number;
  size?: number;
}

export interface OpcionCatalogo {
  codigo: string;
  nombre: string;
  esTermoplastico?: boolean;
}

export interface CuerpoMaterial {
  nombre: string;
  categoriaCodigo: string;
  subcategoriaCodigo: string | null;
  codigoResinaCodigo: string | null;
  colorCodigo: string | null;
  unidadMedida: string;
  unidadEmpaque: string;
  precioBase: number;
  factorCalidad: number;
  umbralMerma: number | null;
}

export const CATEGORIA_PLASTICO = "PLASTICO";

// GET /api/materiales
export async function listarMateriales(
  filtros: FiltrosMateriales = {},
): Promise<PaginaMateriales> {
  const { data } = await clienteApi.get("/materiales", {
    params: {
      categoria: filtros.categoria || undefined,
      resina: filtros.resina || undefined,
      color: filtros.color || undefined,
      empaque: filtros.empaque || undefined,
      activo: filtros.activo || undefined,
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

// GET /api/materiales/categorias
export async function obtenerCategorias(): Promise<OpcionCatalogo[]> {
  const { data } = await clienteApi.get("/materiales/categorias");
  return Array.isArray(data) ? data : [];
}

// GET /api/materiales/subcategorias?categoria=
export async function obtenerSubcategorias(categoria: string): Promise<OpcionCatalogo[]> {
  const { data } = await clienteApi.get("/materiales/subcategorias", {
    params: { categoria },
  });
  return Array.isArray(data) ? data : [];
}

// GET /api/materiales/resinas
export async function obtenerResinas(): Promise<OpcionCatalogo[]> {
  const { data } = await clienteApi.get("/materiales/resinas");
  return Array.isArray(data) ? data : [];
}

// GET /api/materiales/colores
export async function obtenerColores(): Promise<OpcionCatalogo[]> {
  const { data } = await clienteApi.get("/materiales/colores");
  return Array.isArray(data) ? data : [];
}

// POST /api/materiales
export async function crearMaterial(cuerpo: CuerpoMaterial): Promise<Material> {
  const { data } = await clienteApi.post<Material>("/materiales", cuerpo);
  return data;
}

// PUT /api/materiales/{id}
export async function actualizarMaterial(
  id: string,
  cuerpo: CuerpoMaterial,
): Promise<Material> {
  const { data } = await clienteApi.put<Material>(`/materiales/${id}`, cuerpo);
  return data;
}

// PATCH /api/materiales/{id} — activar / desactivar
export async function cambiarEstadoMaterial(id: string, activo: boolean): Promise<Material> {
  const { data } = await clienteApi.patch<Material>(`/materiales/${id}`, { activo });
  return data;
}
