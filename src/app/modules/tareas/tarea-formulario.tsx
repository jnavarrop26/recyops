import { useEffect, useState } from "react";
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
  const [titulo, setTitulo] = useState(tarea?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [asignadoId, setAsignadoId] = useState(tarea?.asignadoId ?? "");
  const [bodegaId, setBodegaId] = useState(tarea?.bodegaId ?? SIN_BODEGA);
  const [prioridad, setPrioridad] = useState<PrioridadTarea>(tarea?.prioridad ?? "MEDIA");
  const [fechaLimite, setFechaLimite] = useState(tarea?.fechaLimite ?? "");

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

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    if (titulo.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (!asignadoId) {
      setError("Selecciona el trabajador asignado.");
      return;
    }

    setEnviando(true);
    try {
      const cuerpo = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        asignadoId,
        bodegaId: bodegaId === SIN_BODEGA ? null : bodegaId,
        prioridad,
        fechaLimite: fechaLimite || null,
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
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {error && <div className={styles.alertaError}>{error}</div>}

      <div className={styles.campo}>
        <Label htmlFor="tareaTitulo">Título *</Label>
        <Input
          id="tareaTitulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Clasificar lote de PET recibido"
        />
      </div>

      <div className={styles.campo}>
        <Label htmlFor="tareaDesc">Descripción</Label>
        <Textarea
          id="tareaDesc"
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles, ubicación, instrucciones..."
        />
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Asignar a *</Label>
          <Select value={asignadoId} onValueChange={setAsignadoId}>
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
        </div>
        <div className={styles.campo}>
          <Label>Bodega</Label>
          <Select value={bodegaId} onValueChange={setBodegaId}>
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
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Prioridad *</Label>
          <Select value={prioridad} onValueChange={(v) => setPrioridad(v as PrioridadTarea)}>
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
        </div>
        <div className={styles.campo}>
          <Label htmlFor="tareaFecha">Fecha límite</Label>
          <Input
            id="tareaFecha"
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
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
