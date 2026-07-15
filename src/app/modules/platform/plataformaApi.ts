import { clienteApi } from "@/app/http/clienteApi";

export interface CuerpoNuevaEmpresa {
  nombre: string;
  nit: string;
  schemaNombre: string;
  adminEmail: string;
  adminNombreCompleto: string;
  adminUsername: string;
  adminPassword?: string;
}

export interface RespuestaEmpresaCreada {
  empresaId: string;
  nombre: string;
  nit: string;
  schemaNombre: string;
  adminSupabaseId: string;
  adminEmail: string;
  passwordTemporal: string | null;
}

// POST /api/platform/empresas
export async function provisionarEmpresa(
  cuerpo: CuerpoNuevaEmpresa,
): Promise<RespuestaEmpresaCreada> {
  const { data } = await clienteApi.post<RespuestaEmpresaCreada>("/platform/empresas", cuerpo);
  return data;
}
