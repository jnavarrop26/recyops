import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { obtenerBodegas, obtenerTrabajadores, type Bodega, type Trabajador } from "@/app/modules/trabajadores/trabajadoresApi";
import {
  actualizarTarea,
  crearTarea,
  PRIORIDADES,
  type PrioridadTarea,
  type Tarea,
} from "@/app/modules/tareas/tareasApi";
import { tareaSchema, type TareaFormValues } from "@/app/modules/tareas/tareaSchema";
import styles from "@/app/modules/trabajadores/registrar-trabajador.module.css";

const SIN_BODEGA = "__ninguna__";

/** Creación/edición de tarea (solo admin). */
export function TareaFormulario({
  tarea,
  alGuardar,
  alCerrar,
}: {
  tarea?: Tarea | null;
  alGuardar: (guardada: Tarea) => void;
  alCerrar?: () => void;
}) {
  const esEdicion = Boolean(tarea);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: tarea?.titulo ?? "",
      descripcion: tarea?.descripcion ?? "",
      asignadoId: tarea?.asignadoId ?? "",
      bodegaId: tarea?.bodegaId ?? SIN_BODEGA,
      prioridad: tarea?.prioridad ?? "MEDIA",
      fechaLimite: tarea?.fechaLimite ?? "",
    },
  });

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [listaTrabajadores, listaBodegas] = await Promise.all([
          obtenerTrabajadores(),
          obtenerBodegas(),
        ]);
        setTrabajadores(listaTrabajadores.filter((t) => t.estado === "ACTIVO"));
        setBodegas(listaBodegas);
      } catch {
        setError("No se pudieron cargar los trabajadores o bodegas.");
      }
    })();
  }, []);

  async function onSubmit(valores: TareaFormValues) {
    setError(null);
    setEnviando(true);
    try {
      const cuerpo = {
        titulo: valores.titulo.trim(),
        descripcion: valores.descripcion.trim() || null,
        asignadoId: valores.asignadoId,
        bodegaId: valores.bodegaId === SIN_BODEGA ? null : valores.bodegaId,
        prioridad: valores.prioridad as PrioridadTarea,
        fechaLimite: valores.fechaLimite || null,
      };
      const guardada = esEdicion
        ? await actualizarTarea(tarea!.id, cuerpo)
        : await crearTarea(cuerpo);
      alGuardar(guardada);
    } catch {
      setError("No se pudo guardar la tarea. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {error && <div className={styles.alertaError}>{error}</div>}

      <div className={styles.campo}>
        <Label htmlFor="tareaTitulo">Título *</Label>
        <Input
          id="tareaTitulo"
          {...register("titulo")}
          placeholder="Clasificar lote de PET recibido"
        />
        {errors.titulo && <span className={styles.errorCampo}>{errors.titulo.message}</span>}
      </div>

      <div className={styles.campo}>
        <Label htmlFor="tareaDesc">Descripción</Label>
        <Textarea
          id="tareaDesc"
          rows={3}
          {...register("descripcion")}
          placeholder="Detalles, ubicación, instrucciones..."
        />
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Asignar a *</Label>
          <Controller
            name="asignadoId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {trabajadores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.asignadoId && <span className={styles.errorCampo}>{errors.asignadoId.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Bodega</Label>
          <Controller
            name="bodegaId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin bodega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_BODEGA}>Sin bodega</SelectItem>
                  {bodegas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Prioridad *</Label>
          <Controller
            name="prioridad"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className={styles.campo}>
          <Label htmlFor="tareaFecha">Fecha límite</Label>
          <Input
            id="tareaFecha"
            type="date"
            {...register("fechaLimite")}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        {alCerrar && (
          <Button type="button" variant="outline" onClick={alCerrar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}
