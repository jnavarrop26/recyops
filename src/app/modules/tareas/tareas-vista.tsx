import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { TareaFormulario } from "@/app/modules/tareas/tarea-formulario";
import { TareaDetalle } from "@/app/modules/tareas/tarea-detalle";
import {
  cambiarEstadoTarea,
  eliminarTarea,
  ETIQUETA_ESTADO,
  listarTareas,
  type EstadoTarea,
  type Tarea,
} from "@/app/modules/tareas/tareasApi";
import styles from "@/app/modules/tareas/tareas-vista.module.css";

const COLUMNAS: EstadoTarea[] = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "REVISION", "CANCELADA"];

const SIGUIENTE: Partial<Record<EstadoTarea, EstadoTarea>> = {
  PENDIENTE: "EN_PROGRESO",
  EN_PROGRESO: "COMPLETADA",
  COMPLETADA: "REVISION",
};

const ETIQUETA_AVANZAR: Partial<Record<EstadoTarea, string>> = {
  PENDIENTE: "→ En progreso",
  EN_PROGRESO: "→ Completada",
  COMPLETADA: "→ Revisión",
};

function fmtFecha(iso: string | null): string {
  if (!iso) return "";
  const f = new Date(iso + "T00:00:00");
  return f.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

/** Tablero kanban del administrador: 4 columnas con movimientos por botón. */
export function TareasVista() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Tarea | null>(null);
  const [detalle, setDetalle] = useState<Tarea | null>(null);
  const [moviendo, setMoviendo] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setTareas(await listarTareas());
    } catch {
      setError("No se pudieron cargar las tareas. Revisa la conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function reemplazar(actualizada: Tarea) {
    setTareas((lista) => lista.map((t) => (t.id === actualizada.id ? actualizada : t)));
  }

  async function mover(tarea: Tarea, destino: EstadoTarea) {
    setMoviendo(tarea.id);
    try {
      reemplazar(await cambiarEstadoTarea(tarea.id, destino));
    } catch {
      setError("No se pudo mover la tarea. Intenta de nuevo.");
    } finally {
      setMoviendo(null);
    }
  }

  async function eliminar(tarea: Tarea) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente "${tarea.titulo}"? Se borra la tarea y toda su bitácora de avances. Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setMoviendo(tarea.id);
    try {
      await eliminarTarea(tarea.id);
      setTareas((lista) => lista.filter((t) => t.id !== tarea.id));
    } catch {
      setError("No se pudo eliminar la tarea. Intenta de nuevo.");
    } finally {
      setMoviendo(null);
    }
  }

  function manejarGuardado(guardada: Tarea) {
    setModalAbierto(false);
    setEditando(null);
    setTareas((lista) => {
      const existe = lista.some((t) => t.id === guardada.id);
      return existe ? lista.map((t) => (t.id === guardada.id ? guardada : t)) : [guardada, ...lista];
    });
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Tareas</h1>
          <p className={styles.subtitulo}>
            Asigna trabajo al equipo y sigue su avance por el tablero.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={cargar} disabled={cargando}>
            <RefreshCw size={15} />
            Actualizar
          </Button>
          <Button onClick={() => setModalAbierto(true)}>
            <Plus size={15} />
            Nueva tarea
          </Button>
        </div>
      </div>

      {cargando ? (
        <div className={styles.estado}>Cargando tareas...</div>
      ) : error && tareas.length === 0 ? (
        <div className={`${styles.estado} ${styles.error}`}>{error}</div>
      ) : (
        <div className={styles.tablero}>
          {COLUMNAS.map((columna) => {
            const delaColumna = tareas.filter((t) => t.estado === columna);
            return (
              <div key={columna} className={styles.columna}>
                <div className={styles.columnaTitulo}>
                  <span>{ETIQUETA_ESTADO[columna]}</span>
                  <span className={styles.conteo}>{delaColumna.length}</span>
                </div>

                {delaColumna.length === 0 ? (
                  <div className={styles.vacio}>Sin tareas</div>
                ) : (
                  delaColumna.map((tarea) => (
                    <div
                      key={tarea.id}
                      className={`${styles.tarjeta} ${columna === "CANCELADA" ? styles.tarjetaCancelada : ""}`}
                    >
                      <div className={styles.tarjetaTitulo}>{tarea.titulo}</div>
                      {tarea.descripcion && (
                        <div className={styles.tarjetaDesc}>{tarea.descripcion}</div>
                      )}
                      <div className={styles.meta}>
                        <span className={`${styles.chip} ${styles[`prioridad${tarea.prioridad}`]}`}>
                          {tarea.prioridad}
                        </span>
                        <span>{tarea.asignadoNombre}</span>
                        {tarea.bodegaNombre && <span>· {tarea.bodegaNombre}</span>}
                        {tarea.fechaLimite && (
                          <span className={tarea.vencida ? styles.vencida : undefined}>
                            · {fmtFecha(tarea.fechaLimite)}
                            {tarea.vencida && " (vencida)"}
                          </span>
                        )}
                      </div>
                      <div className={styles.acciones}>
                        {SIGUIENTE[columna] && (
                          <Button
                            size="sm"
                            disabled={moviendo === tarea.id}
                            onClick={() => mover(tarea, SIGUIENTE[columna]!)}
                          >
                            {ETIQUETA_AVANZAR[columna]}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setDetalle(tarea)}>
                          Detalle
                        </Button>
                        {(columna === "PENDIENTE" || columna === "EN_PROGRESO") && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setEditando(tarea)}>
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={moviendo === tarea.id}
                              onClick={() => mover(tarea, "CANCELADA")}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {columna === "REVISION" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={moviendo === tarea.id}
                            onClick={() => eliminar(tarea)}
                          >
                            Eliminar
                          </Button>
                        )}
                        {columna === "CANCELADA" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={moviendo === tarea.id}
                            onClick={() => mover(tarea, "PENDIENTE")}
                          >
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: detalle con bitácora de avances */}
      <Dialog open={detalle !== null} onOpenChange={(abierto) => !abierto && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detalle?.titulo}</DialogTitle>
            <DialogDescription>
              Bitácora de avances de la tarea.
            </DialogDescription>
          </DialogHeader>
          {detalle && <TareaDetalle tarea={detalle} puedeAgregar />}
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalAbierto || editando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setModalAbierto(false);
            setEditando(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Cambia los datos o reasigna la tarea."
                : "Describe el trabajo y asígnalo a un trabajador activo."}
            </DialogDescription>
          </DialogHeader>
          <TareaFormulario
            tarea={editando}
            alGuardar={manejarGuardado}
            alCerrar={() => {
              setModalAbierto(false);
              setEditando(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
