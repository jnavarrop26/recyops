import axios from "axios";

// Código de estado HTTP de un error de Axios, o undefined si no aplica
// (error de red, timeout, o excepción ajena a HTTP).
export function estadoHttp(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

// Mensaje de error que envía el propio backend ({ mensaje: "..." }), si existe.
export function mensajeDelServidor(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as { mensaje?: unknown } | undefined;
  return typeof data?.mensaje === "string" ? data.mensaje : undefined;
}

const MENSAJES_BASE: Record<number, string> = {
  400: "Revisa los datos del formulario.",
  403: "No tienes permisos para esta acción.",
  404: "Registro no encontrado.",
  409: "La operación no es válida en el estado actual.",
};

// Traduce un error HTTP a un mensaje para el usuario. Cada formulario puede
// sobreescribir mensajes por código (típicamente el 409, cuyo significado
// depende de la operación) y el mensaje por defecto.
export function interpretarErrorHttp(
  error: unknown,
  mensajes: Partial<Record<number, string>> = {},
  porDefecto = "Ocurrió un error. Intenta de nuevo.",
): string {
  const estado = estadoHttp(error);
  if (estado === undefined) return porDefecto;
  return mensajes[estado] ?? MENSAJES_BASE[estado] ?? porDefecto;
}
