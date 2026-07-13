import { clienteApi } from "./clienteApi";

export type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "REVISION" | "CANCELADA";
export type PrioridadTarea = "BAJA" | "MEDIA" | "ALTA";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  asignadoId: string;
  asignadoNombre: string;
  bodegaId: string | null;
  bodegaNombre: string | null;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  fechaLimite: string | null; // YYYY-MM-DD
  vencida: boolean;
  creadoPorNombre: string;
  fechaCreacion: string;
  fechaCompletada: string | null;
}

export interface CuerpoTarea {
  titulo: string;
  descripcion: string | null;
  asignadoId: string;
  bodegaId: string | null;
  prioridad: PrioridadTarea;
  fechaLimite: string | null;
}

export const ESTADOS_TAREA: EstadoTarea[] = [
  "PENDIENTE",
  "EN_PROGRESO",
  "COMPLETADA",
  "REVISION",
  "CANCELADA",
];
export const PRIORIDADES: PrioridadTarea[] = ["BAJA", "MEDIA", "ALTA"];

export const ETIQUETA_ESTADO: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  REVISION: "Revisión",
  CANCELADA: "Cancelada",
};

// Entrada de la bitácora de una tarea (inmutable: no se edita ni se borra suelta)
export interface Avance {
  id: string;
  cantidad: number | null;
  descripcion: string;
  usuarioNombre: string;
  fechaRegistro: string;
}

// GET /api/tareas — tablero completo (solo admin)
export async function listarTareas(): Promise<Tarea[]> {
  const { data } = await clienteApi.get("/tareas");
  return Array.isArray(data) ? data : [];
}

// GET /api/tareas/mias — tareas del usuario autenticado
export async function misTareas(): Promise<Tarea[]> {
  const { data } = await clienteApi.get("/tareas/mias");
  return Array.isArray(data) ? data : [];
}

// POST /api/tareas (admin)
export async function crearTarea(cuerpo: CuerpoTarea): Promise<Tarea> {
  const { data } = await clienteApi.post<Tarea>("/tareas", cuerpo);
  return data;
}

// PUT /api/tareas/{id} (admin)
export async function actualizarTarea(id: string, cuerpo: CuerpoTarea): Promise<Tarea> {
  const { data } = await clienteApi.put<Tarea>(`/tareas/${id}`, cuerpo);
  return data;
}

// PATCH /api/tareas/{id}/estado?valor= — admin libre; operario solo avanza las suyas
export async function cambiarEstadoTarea(id: string, valor: EstadoTarea): Promise<Tarea> {
  const { data } = await clienteApi.patch<Tarea>(`/tareas/${id}/estado`, null, {
    params: { valor },
  });
  return data;
}

// GET /api/tareas/{id}/avances — bitácora (admin o asignado)
export async function listarAvances(tareaId: string): Promise<Avance[]> {
  const { data } = await clienteApi.get(`/tareas/${tareaId}/avances`);
  return Array.isArray(data) ? data : [];
}

// POST /api/tareas/{id}/avances — el asignado registra mientras está EN_PROGRESO
export async function agregarAvance(
  tareaId: string,
  cantidad: number | null,
  descripcion: string,
): Promise<Avance> {
  const { data } = await clienteApi.post<Avance>(`/tareas/${tareaId}/avances`, {
    cantidad,
    descripcion,
  });
  return data;
}

// DELETE /api/tareas/{id} — solo admin y solo tareas en REVISION
export async function eliminarTarea(tareaId: string): Promise<void> {
  await clienteApi.delete(`/tareas/${tareaId}`);
}
