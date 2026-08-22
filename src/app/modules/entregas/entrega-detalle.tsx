import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { ChipEstadoEntrega } from "@/app/modules/entregas/chip-estado-entrega";
import {
  obtenerEntrega,
  cambiarEstadoEntrega,
  siguienteEstado,
  type Entrega,
} from "@/app/modules/entregas/entregasApi";
import { abrirReciboEntrega } from "@/app/modules/entregas/recibo-entrega";
import { interpretarErrorHttp } from "@/app/http/errores";
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

  useEffect(() => {
    if (!id) return;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        setEntrega(await obtenerEntrega(id));
      } catch (e) {
        setError(interpretarErrorHttp(e, {}, "No se pudo cargar la entrega."));
      } finally {
        setCargando(false);
      }
    })();
  }, [id]);

  async function avanzar() {
    if (!entrega) return;
    const siguiente = siguienteEstado(entrega.estado);
    if (!siguiente) return;
    try {
      const actualizada = await cambiarEstadoEntrega(entrega.id, siguiente);
      setEntrega(actualizada);
    } catch (e) {
      setError(interpretarErrorHttp(e, {
        409: "Transición de estado no permitida.",
        400: "Transición de estado no permitida.",
      }, "No se pudo cambiar el estado de la entrega."));
    }
  }

  async function recibo() {
    if (!entrega) return;
    try {
      await abrirReciboEntrega(entrega.id);
    } catch {
      setError("No se pudo generar el recibo.");
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
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={recibo}>
            Generar recibo
          </Button>
          {siguiente && <Button onClick={avanzar}>Avanzar a {siguiente}</Button>}
        </div>
      </div>

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
  );
}
