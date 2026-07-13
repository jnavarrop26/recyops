import { clienteApi } from "./clienteApi";

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
export async function obtenerActividadDiaria(dias: number): Promise<ActividadDia[]> {
  const { data } = await clienteApi.get("/dashboard/actividad", { params: { dias } });
  return Array.isArray(data) ? data : [];
}
