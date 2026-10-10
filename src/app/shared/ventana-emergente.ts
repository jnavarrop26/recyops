import { toast } from "sonner";

/** El navegador bloqueó `window.open` (bloqueador de ventanas emergentes). */
export class VentanaBloqueadaError extends Error {
  constructor() {
    super("El navegador bloqueó la ventana emergente.");
    this.name = "VentanaBloqueadaError";
  }
}

/** Avisa por qué no se pudo abrir el recibo en una pestaña nueva. */
export function notificarErrorRecibo(error: unknown) {
  toast.error(
    error instanceof VentanaBloqueadaError
      ? "El navegador bloqueó la ventana emergente. Usa «Ver» para ver el recibo."
      : "No se pudo generar el recibo.",
  );
}
