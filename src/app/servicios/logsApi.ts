import { clienteApi } from "./clienteApi";

export type ArchivoLog = "GENERAL" | "TRANSACCIONES" | "ERRORES";
export type NivelLog = "DEBUG" | "INFO" | "WARN" | "ERROR";

// Entrada de log parseada por el backend (modulo log).
export interface LineaLog {
  fecha: string;
  nivel: NivelLog | string;
  usuario: string;
  empresa: string;
  logger: string;
  mensaje: string;
  detalle: string | null;
}

export const ARCHIVOS_LOG: { valor: ArchivoLog; etiqueta: string }[] = [
  { valor: "GENERAL", etiqueta: "General (recyops-api.log)" },
  { valor: "TRANSACCIONES", etiqueta: "Transacciones (transacciones.log)" },
  { valor: "ERRORES", etiqueta: "Errores (errores.log)" },
];

// GET /api/admin/logs?archivo=&lineas=
export async function obtenerLogs(
  archivo: ArchivoLog,
  lineas = 200,
): Promise<LineaLog[]> {
  const { data } = await clienteApi.get("/admin/logs", {
    params: { archivo, lineas },
  });
  return Array.isArray(data) ? data : [];
}
