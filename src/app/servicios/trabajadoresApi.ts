import { clienteApi } from "./clienteApi";

export interface Bodega {
  id: string;
  nombre: string;
}

export interface Rol {
  id: string;
  nombre: string;
}

export interface Trabajador {
  id: string;
  nombreCompleto: string;
  username: string;
  email: string;
  telefono?: string;
  estado: string;
  rolId: string;
  rolNombre: string;
  bodegaId: string | null;
  bodegaNombre: string | null;
}

export interface CuerpoEditarTrabajador {
  nombreCompleto: string;
  telefono: string | null;
  bodegaId: string;
  rolId: string;
}

export interface NuevoTrabajador {
  nombreCompleto: string;
  username: string;
  email: string;
  telefono?: string;
  bodegaId: string;
  rolId: string;
  password?: string;
}

export interface RespuestaTrabajadorCreado {
  id: string;
  username: string;
  email: string;
  estado: string;
  passwordTemporal?: string;
}

// GET /api/bodegas
export async function obtenerBodegas(): Promise<Bodega[]> {
  const { data } = await clienteApi.get("/bodegas");
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

// GET /api/roles
export async function obtenerRoles(): Promise<Rol[]> {
  const { data } = await clienteApi.get("/roles");
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

// GET /api/admin/usuarios
export async function obtenerTrabajadores(): Promise<Trabajador[]> {
  const { data } = await clienteApi.get("/admin/usuarios");
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

// POST /api/admin/usuarios
export async function registrarTrabajador(
  payload: NuevoTrabajador,
): Promise<RespuestaTrabajadorCreado> {
  const { data } = await clienteApi.post<RespuestaTrabajadorCreado>("/admin/usuarios", payload);
  return data;
}

// PUT /api/admin/usuarios/{id}
export async function actualizarTrabajador(
  id: string,
  cuerpo: CuerpoEditarTrabajador,
): Promise<Trabajador> {
  const { data } = await clienteApi.put<Trabajador>(`/admin/usuarios/${id}`, cuerpo);
  return data;
}

// PATCH /api/admin/usuarios/{id}/estado?valor=ACTIVO|INACTIVO
// Desactivar también bloquea el login del trabajador en Supabase.
export async function cambiarEstadoTrabajador(
  id: string,
  valor: "ACTIVO" | "INACTIVO",
): Promise<Trabajador> {
  const { data } = await clienteApi.patch<Trabajador>(`/admin/usuarios/${id}/estado`, null, {
    params: { valor },
  });
  return data;
}
