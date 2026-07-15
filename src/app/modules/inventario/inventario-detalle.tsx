import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import {
  obtenerLinea,
  obtenerMovimientos,
  type LineaInventario,
  type MovimientoInventario,
  type TipoOperacion,
} from "@/app/modules/inventario/inventarioApi";
import styles from "@/app/modules/inventario/inventario-detalle.module.css";

const TAMANO_PAGINA = 20;

const CLASE_OP: Record<TipoOperacion, string> = {
  ENTRADA: styles.opEntrada,
  SALIDA: styles.opSalida,
  AJUSTE: styles.opAjuste,
  MERMA: styles.opMerma,
  TRANSFORMACION: styles.opTransformacion,
};

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
};

export function InventarioDetalle() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();

  const [linea, setLinea] = useState<LineaInventario | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMovimientos = useCallback(
    async (paginaSolicitada: number) => {
      if (!id) return;
      try {
        const datos = await obtenerMovimientos(id, paginaSolicitada, TAMANO_PAGINA);
        setMovimientos(datos.content);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setMovimientos([]);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const datosLinea = await obtenerLinea(id);
        setLinea(datosLinea);
        await cargarMovimientos(0);
      } catch (e: any) {
        setError(e?.response?.status === 404 ? "Registro no encontrado." : "No se pudo cargar la línea de inventario.");
      } finally {
        setCargando(false);
      }
    })();
  }, [id, cargarMovimientos]);

  function abrirReferencia(referencia: string | null) {
    if (!referencia) return;
    // Navegación al documento origen cuando esas vistas existan.
    if (referencia.startsWith("ENT-")) navegar(`/ingreso/historial?ref=${referencia}`);
    else if (referencia.startsWith("CNV-")) navegar(`/convenios?ref=${referencia}`);
  }

  if (cargando) return <div className={styles.estado}>Cargando línea de inventario...</div>;
  if (error || !linea) return <div className={styles.estado}>{error ?? "Registro no encontrado."}</div>;

  return (
    <div className={styles.contenedor}>
      <div className={styles.volver}>
        <Button variant="outline" size="sm" onClick={() => navegar("/inventario")}>
          ← Volver al inventario
        </Button>
      </div>

      <h1 className={styles.titulo}>{linea.tipoMaterialNombre}</h1>
      <p className={styles.subtitulo}>
        {linea.categoriaNombre} · {linea.bodegaNombre}
      </p>

      <div className={styles.resumen}>
        <div className={styles.tarjetaResumen}>
          <div className={styles.resumenEtiqueta}>Stock actual</div>
          <div className={styles.resumenValor}>{linea.stockActual.toLocaleString("es-CO")}</div>
        </div>
        <div className={styles.tarjetaResumen}>
          <div className={styles.resumenEtiqueta}>Stock mínimo</div>
          <div className={styles.resumenValor}>{linea.stockMinimo.toLocaleString("es-CO")}</div>
        </div>
        <div className={styles.tarjetaResumen}>
          <div className={styles.resumenEtiqueta}>Stock máximo</div>
          <div className={styles.resumenValor}>{linea.stockMaximo.toLocaleString("es-CO")}</div>
        </div>
        <div className={styles.tarjetaResumen}>
          <div className={styles.resumenEtiqueta}>Unidad</div>
          <div className={styles.resumenValor}>{linea.unidadMedida}</div>
        </div>
      </div>

      <div className={styles.tarjeta}>
        {movimientos.length === 0 ? (
          <div className={styles.estado}>No hay movimientos registrados.</div>
        ) : (
          <>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Operación</th>
                  <th className={styles.derecha}>Cantidad</th>
                  <th className={styles.derecha}>Anterior</th>
                  <th className={styles.derecha}>Nueva</th>
                  <th>Referencia</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className={`${styles.opChip} ${CLASE_OP[m.tipoOperacion]}`}>
                        {m.tipoOperacion}
                      </span>
                    </td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{m.cantidad.toLocaleString("es-CO")}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{m.cantidadAnterior.toLocaleString("es-CO")}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{m.cantidadNueva.toLocaleString("es-CO")}</td>
                    <td>
                      {m.referencia ? (
                        m.referencia.startsWith("ENT-") || m.referencia.startsWith("CNV-") ? (
                          <button type="button" className={styles.refLink} onClick={() => abrirReferencia(m.referencia)}>
                            {m.referencia}
                          </button>
                        ) : (
                          <span className={styles.mono}>{m.referencia}</span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{m.usuarioNombre}</td>
                    <td className={styles.mono}>{formatearFecha(m.fechaRegistro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.paginacion}>
              <span>Página {pagina + 1} de {Math.max(totalPaginas, 1)}</span>
              <div className={styles.controlesPagina}>
                <Button variant="outline" size="sm" disabled={pagina <= 0} onClick={() => cargarMovimientos(pagina - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={pagina >= totalPaginas - 1} onClick={() => cargarMovimientos(pagina + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
