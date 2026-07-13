import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { TareaDetalle } from "./tarea-detalle";
import {
  cambiarEstadoTarea,
  ETIQUETA_ESTADO,
  misTareas,
  type Tarea,
} from "../servicios/tareasApi";
import styles from "./tareas-vista.module.css";

function fmtFecha(iso: string | null): string {
  if (!iso) return "";
  const f = new Date(iso + "T00:00:00");
  return f.toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short" });
}

/**
 * Vista del operario: sus tareas ordenadas por urgencia, con un botón
 * grande para avanzar cada una (Iniciar → Marcar completada).
 */
export function MisTareasVista() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Tarea | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setTareas(await misTareas());
    } catch {
      setError("No se pudieron cargar tus tareas. Revisa la conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function avanzar(tarea: Tarea) {
    const destino = tarea.estado === "PENDIENTE" ? "EN_PROGRESO" : "COMPLETADA";
    setMoviendo(tarea.id);
    try {
      const actualizada = await cambiarEstadoTarea(tarea.id, destino);
      setTareas((lista) => lista.map((t) => (t.id === actualizada.id ? actualizada : t)));
    } catch {
      setError("No se pudo actualizar la tarea. Intenta de nuevo.");
    } finally {
      setMoviendo(null);
    }
  }

  const activas = tareas.filter((t) => t.estado === "PENDIENTE" || t.estado === "EN_PROGRESO");
  const cerradas = tareas.filter(
    (t) => t.estado === "COMPLETADA" || t.estado === "REVISION" || t.estado === "CANCELADA",
  );

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Mis tareas</h1>
          <p className={styles.subtitulo}>Lo que tienes asignado, ordenado por urgencia.</p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={cargando}>
          <RefreshCw size={15} />
          Actualizar
        </Button>
      </div>

      {cargando ? (
        <div className={styles.estado}>Cargando tus tareas...</div>
      ) : error && tareas.length === 0 ? (
        <div className={`${styles.estado} ${styles.error}`}>{error}</div>
      ) : tareas.length === 0 ? (
        <div className={styles.estado}>No tienes tareas asignadas. 🎉</div>
      ) : (
        <div className={styles.lista}>
          {activas.map((tarea) => (
            <div key={tarea.id} className={styles.tarjeta}>
              <div className={styles.tarjetaTitulo}>{tarea.titulo}</div>
              {tarea.descripcion && <div className={styles.tarjetaDesc}>{tarea.descripcion}</div>}
              <div className={styles.meta}>
                <span className={`${styles.chip} ${styles[`prioridad${tarea.prioridad}`]}`}>
                  {tarea.prioridad}
                </span>
                <span>{ETIQUETA_ESTADO[tarea.estado]}</span>
                {tarea.bodegaNombre && <span>· {tarea.bodegaNombre}</span>}
                {tarea.fechaLimite && (
                  <span className={tarea.vencida ? styles.vencida : undefined}>
                    · vence {fmtFecha(tarea.fechaLimite)}
                    {tarea.vencida && " (vencida)"}
                  </span>
                )}
              </div>
              <div className={styles.acciones}>
                <Button size="sm" disabled={moviendo === tarea.id} onClick={() => avanzar(tarea)}>
                  {moviendo === tarea.id
                    ? "..."
                    : tarea.estado === "PENDIENTE"
                      ? "Iniciar"
                      : "Marcar completada"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDetalle(tarea)}>
                  {tarea.estado === "EN_PROGRESO" ? "Registrar avance" : "Ver avances"}
                </Button>
              </div>
            </div>
          ))}

          {cerradas.length > 0 && (
            <>
              <div className={styles.columnaTitulo} style={{ marginTop: 8 }}>
                <span>Cerradas</span>
                <span className={styles.conteo}>{cerradas.length}</span>
              </div>
              {cerradas.map((tarea) => (
                <div key={tarea.id} className={`${styles.tarjeta} ${styles.tarjetaCancelada}`}>
                  <div className={styles.tarjetaTitulo}>{tarea.titulo}</div>
                  <div className={styles.meta}>
                    <span>
                      {tarea.estado === "REVISION" ? "En revisión" : ETIQUETA_ESTADO[tarea.estado]}
                    </span>
                    {tarea.fechaCompletada && (
                      <span>· {new Date(tarea.fechaCompletada).toLocaleString("es-CO")}</span>
                    )}
                  </div>
                  <div className={styles.acciones}>
                    <Button variant="ghost" size="sm" onClick={() => setDetalle(tarea)}>
                      Ver avances
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Modal: bitácora de avances (registrar solo si está en progreso) */}
      <Dialog open={detalle !== null} onOpenChange={(abierto) => !abierto && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detalle?.titulo}</DialogTitle>
            <DialogDescription>
              Registra lo que hiciste: cantidad (opcional) y una descripción corta por cada cosa.
            </DialogDescription>
          </DialogHeader>
          {detalle && (
            <TareaDetalle tarea={detalle} puedeAgregar={detalle.estado === "EN_PROGRESO"} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
