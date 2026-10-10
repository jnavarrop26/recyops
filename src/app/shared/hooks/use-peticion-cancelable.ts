import { useCallback, useEffect, useRef } from "react";

/**
 * Devuelve una función que crea un AbortSignal nuevo y aborta el de la
 * petición anterior. También aborta la última petición al desmontar.
 *
 * Sirve para cargas que se disparan desde varios lugares (efecto, botón
 * "Actualizar", paginación): solo la respuesta más reciente actualiza el
 * estado, evitando que una respuesta lenta pise a otra más nueva.
 *
 *   const nuevaPeticion = usePeticionCancelable();
 *   const signal = nuevaPeticion();
 *   const datos = await obtenerAlgo(id, signal);
 *   if (signal.aborted) return;
 */
export function usePeticionCancelable() {
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => () => controladorRef.current?.abort(), []);

  return useCallback(() => {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    return controlador.signal;
  }, []);
}
