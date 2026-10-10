import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Eye, Printer } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ChipEstadoEntrega } from "@/app/modules/entregas/chip-estado-entrega";
import {
  obtenerEntrega,
  cambiarEstadoEntrega,
  siguienteEstado,
  type Entrega,
} from "@/app/modules/entregas/entregasApi";
import { abrirReciboEntrega, plantillaReciboEntrega } from "@/app/modules/entregas/recibo-entrega";
import { VisorRecibo } from "@/app/shared/components/visor-recibo";
import { notificarErrorRecibo } from "@/app/shared/ventana-emergente";
import { interpretarErrorHttp } from "@/app/http/errores";
import { DialogoConfirmacion } from "@/app/shared/components/dialogo-confirmacion";
import styles from "@/app/modules/bodega/bodega-detalle.module.css";

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
};

export function EntregaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();

  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoAvance, setConfirmandoAvance] = useState(false);
  const [avanzando, setAvanzando] = useState(false);
  const [visorAbierto, setVisorAbierto] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Cambiar de entrega aborta la carga anterior.
    const controlador = new AbortController();
    const { signal } = controlador;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const datos = await obtenerEntrega(id, signal);
        if (!signal.aborted) setEntrega(datos);
      } catch (e) {
        if (!signal.aborted) setError(interpretarErrorHttp(e, {}, "No se pudo cargar la entrega."));
      } finally {
        if (!signal.aborted) setCargando(false);
      }
    })();
    return () => controlador.abort();
  }, [id]);

  // Los errores de acciones se muestran como toast: la página (y el botón
  // "Volver") siguen visibles.
  async function avanzar() {
    if (!entrega || avanzando) return;
    const siguiente = siguienteEstado(entrega.estado);
    if (!siguiente) return;
    setAvanzando(true);
    try {
      const actualizada = await cambiarEstadoEntrega(entrega.id, siguiente);
      setEntrega(actualizada);
      toast.success(`Entrega ${actualizada.codigo} marcada como ${actualizada.estado}.`);
    } catch (e) {
      toast.error(interpretarErrorHttp(e, {
        409: "Transición de estado no permitida.",
        400: "Transición de estado no permitida.",
      }, "No se pudo cambiar el estado de la entrega."));
    } finally {
      setAvanzando(false);
      setConfirmandoAvance(false);
    }
  }

  async function recibo() {
    if (!entrega) return;
    try {
      await abrirReciboEntrega(entrega.id);
    } catch (e) {
      notificarErrorRecibo(e);
    }
  }

  if (cargando) return <div className={styles.estado}>Cargando entrega...</div>;
  if (error || !entrega) return <div className={styles.estado}>{error ?? "Registro no encontrado."}</div>;

  const siguiente = siguienteEstado(entrega.estado);

  return (
    <div className={styles.contenedor}>
      <div className={styles.volver}>
        <Button variant="outline" size="sm" onClick={() => navegar("/entregas")}>
          ← Volver a entregas
        </Button>
      </div>

      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>{entrega.codigo}</h1>
          <ChipEstadoEntrega estado={entrega.estado} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Button variant="outline" onClick={() => setVisorAbierto(true)}>
            <Eye aria-hidden="true" />
            Ver recibo
          </Button>
          <Button variant="outline" onClick={recibo} title="Abre el recibo en una pestaña nueva">
            <Printer aria-hidden="true" />
            Imprimir recibo
          </Button>
          {siguiente && (
            <Button onClick={() => setConfirmandoAvance(true)} disabled={avanzando}>
              {avanzando ? "Actualizando..." : `Avanzar a ${siguiente}`}
            </Button>
          )}
        </div>
      </div>

      <VisorRecibo
        abierto={visorAbierto}
        onOpenChange={setVisorAbierto}
        titulo={`Recibo de la entrega ${entrega.codigo}`}
        cargarHtml={async () => plantillaReciboEntrega(entrega)}
        onAbrirEnPestana={recibo}
      />

      {siguiente && (
        <DialogoConfirmacion
          abierto={confirmandoAvance}
          titulo={`¿Avanzar la entrega a ${siguiente}?`}
          descripcion={`La entrega ${entrega.codigo} pasará de ${entrega.estado} a ${siguiente}. Este cambio no se puede revertir.`}
          textoConfirmar={`Avanzar a ${siguiente}`}
          textoProcesando="Actualizando..."
          procesando={avanzando}
          alConfirmar={avanzar}
          alCancelar={() => setConfirmandoAvance(false)}
        />
      )}

      <div className={styles.tarjeta}>
        <h2 className={styles.tarjetaTitulo}>Información de la entrega</h2>
        <div className={styles.datos}>
          <div className={styles.dato}>
            <span className={styles.datoEtiqueta}>Convenio</span>
            <span className={styles.datoValor}>{entrega.convenioNombre ?? "—"}</span>
          </div>
          <div className={styles.dato}>
            <span className={styles.datoEtiqueta}>Bodega</span>
            <span className={styles.datoValor}>{entrega.bodegaNombre}</span>
          </div>
          <div className={styles.dato}>
            <span className={styles.datoEtiqueta}>Persona que entrega</span>
            <span className={styles.datoValor}>
              {entrega.personaEntregaNombre ?? "—"}
              {entrega.personaEntregaCedula && ` (CC ${entrega.personaEntregaCedula})`}
            </span>
          </div>
          <div className={styles.dato}>
            <span className={styles.datoEtiqueta}>Total</span>
            <span className={`${styles.datoValor} ${styles.mono}`}>
              {entrega.totalKg.toLocaleString("es-CO")} kg
            </span>
          </div>
          <div className={styles.dato}>
            <span className={styles.datoEtiqueta}>Registrado por</span>
            <span className={styles.datoValor}>{entrega.usuarioRegistroNombre}</span>
          </div>
          <div className={styles.dato}>
            <span className={styles.datoEtiqueta}>Fecha de recepción</span>
            <span className={`${styles.datoValor} ${styles.mono}`}>
              {formatearFecha(entrega.fechaRecepcion)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.tarjeta}>
        <h2 className={styles.tarjetaTitulo}>Líneas de material</h2>
        <div className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Material</th>
                <th className={styles.derecha}>Peso (kg)</th>
              </tr>
            </thead>
            <tbody>
              {entrega.lineas.map((linea) => (
                <tr key={linea.tipoMaterialId}>
                  <td>{linea.tipoMaterialNombre}</td>
                  <td className={`${styles.mono} ${styles.derecha}`}>
                    {linea.pesoKg.toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
