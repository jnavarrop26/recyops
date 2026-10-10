import { clienteApi } from "@/app/http/clienteApi";

// Una fila de la tabla de actividad diaria del tablero.
export interface ActividadDia {
  fecha: string; // YYYY-MM-DD
  ingresos: number;
  pesoIngresadoKg: number;
  valorIngresos: number;
  entregas: number;
  pesoRecibidoKg: number;
}

// GET /api/dashboard/actividad?dias=N
export async function obtenerActividadDiaria(
  dias: number,
  signal?: AbortSignal,
): Promise<ActividadDia[]> {
  const { data } = await clienteApi.get("/dashboard/actividad", { params: { dias }, signal });
  return Array.isArray(data) ? data : [];
}
