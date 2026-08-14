import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  agregarAvance,
  listarAvances,
  ETIQUETA_ESTADO,
  type Avance,
  type Tarea,
} from "@/app/modules/tareas/tareasApi";
import { mensajeDelServidor } from "@/app/http/errores";
import { avanceSchema, type AvanceFormValues } from "@/app/modules/tareas/tareaSchema";
import styles from "@/app/modules/tareas/tareas-vista.module.css";

const fmtCantidad = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function fmtMomento(iso: string): string {
  const f = new Date(iso);
  const hoy = new Date();
  const esHoy =
    f.getFullYear() === hoy.getFullYear() &&
    f.getMonth() === hoy.getMonth() &&
    f.getDate() === hoy.getDate();
  const hora = f.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return esHoy
    ? `hoy ${hora}`
    : `${f.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} ${hora}`;
}

/**
 * Detalle de una tarea: bitácora de avances + mini-formulario para registrar
 * uno nuevo (cantidad opcional + descripción). Se usa dentro de un Dialog
 * tanto en el tablero del admin como en "Mis tareas" del operario.
 */
export function TareaDetalle({
  tarea,
  puedeAgregar,
}: {
  tarea: Tarea;
  puedeAgregar: boolean;
}) {
  const [avances, setAvances] = useState<Avance[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AvanceFormValues>({
    resolver: zodResolver(avanceSchema),
    defaultValues: { cantidad: "", descripcion: "" },
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setAvances(await listarAvances(tarea.id));
    } catch {
      setError("No se pudo cargar la bitácora.");
    } finally {
      setCargando(false);
    }
  }, [tarea.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function onSubmit(valores: AvanceFormValues) {
    setError(null);
    const numero = valores.cantidad.trim() === "" ? null : Number(valores.cantidad);
    setEnviando(true);
    try {
      const nuevo = await agregarAvance(tarea.id, numero, valores.descripcion.trim());
      setAvances((lista) => [...lista, nuevo]);
      reset({ cantidad: "", descripcion: "" });
    } catch (err) {
      setError(mensajeDelServidor(err) ?? "No se pudo registrar el avance.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {tarea.descripcion && <p className={styles.detalleDescripcion}>{tarea.descripcion}</p>}
      <div className={styles.meta} style={{ marginBottom: 16 }}>
        <span className={`${styles.chip} ${styles[`prioridad${tarea.prioridad}`]}`}>
          {tarea.prioridad}
        </span>
        <span>{ETIQUETA_ESTADO[tarea.estado]}</span>
        <span>· {tarea.asignadoNombre}</span>
        {tarea.bodegaNombre && <span>· {tarea.bodegaNombre}</span>}
      </div>

      <div className={styles.columnaTitulo} style={{ marginBottom: 8 }}>
        <span>Avances registrados</span>
        <span className={styles.conteo}>{avances.length}</span>
      </div>

      {cargando ? (
        <div className={styles.vacio}>Cargando bitácora...</div>
      ) : avances.length === 0 ? (
        <div className={styles.vacio}>Aún no hay avances registrados.</div>
      ) : (
        <div className={styles.avances}>
          {avances.map((avance) => (
            <div key={avance.id} className={styles.avance}>
              <div className={styles.avanceMeta}>
                <Clock size={12} />
                <span>{fmtMomento(avance.fechaRegistro)}</span>
                <span>· {avance.usuarioNombre}</span>
              </div>
              <div className={styles.avanceTexto}>
                {avance.cantidad !== null && (
                  <strong className={styles.avanceCantidad}>
                    {fmtCantidad.format(avance.cantidad)} ×{" "}
                  </strong>
                )}
                {avance.descripcion}
              </div>
            </div>
          ))}
        </div>
      )}

      {puedeAgregar && (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.avanceForm}>
          {error && <div className={styles.avanceError}>{error}</div>}
          <div className={styles.avanceCampos}>
            <div>
              <Label htmlFor="avanceCantidad">Cantidad</Label>
              <Input
                id="avanceCantidad"
                type="number"
                step="0.01"
                min="0"
                placeholder="15"
                {...register("cantidad")}
              />
              {errors.cantidad && <span className={styles.avanceError}>{errors.cantidad.message}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <Label htmlFor="avanceDesc">¿Qué hiciste?</Label>
              <Input
                id="avanceDesc"
                placeholder="globos de HDPE azul"
                maxLength={300}
                {...register("descripcion")}
              />
              {errors.descripcion && (
                <span className={styles.avanceError}>{errors.descripcion.message}</span>
              )}
            </div>
            <Button type="submit" disabled={enviando} style={{ alignSelf: "flex-end" }}>
              {enviando ? "..." : "+ Agregar"}
            </Button>
          </div>
          <p className={styles.avanceAyuda}>
            La cantidad es opcional. Cada avance queda con tu nombre, fecha y hora, y no se puede
            editar.
          </p>
        </form>
      )}
    </div>
  );
}
