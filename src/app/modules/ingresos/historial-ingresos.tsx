import { useEffect, useState, useCallback } from "react";
import { Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  obtenerHistorialIngresos,
  registrarPagoIngreso,
  esMetodoPago,
  METODOS_PAGO,
  type Ingreso,
  type MetodoPago,
} from "@/app/modules/ingresos/ingresosApi";
import { ChipEstadoPago, ETIQUETA_METODO } from "@/app/modules/ingresos/chip-estado-pago";
import { abrirReciboIngresoPorUuid, cargarHtmlReciboIngreso } from "@/app/modules/ingresos/recibo-ingreso";
import { VisorRecibo } from "@/app/shared/components/visor-recibo";
import { notificarErrorRecibo } from "@/app/shared/ventana-emergente";
import { DialogoConfirmacion } from "@/app/shared/components/dialogo-confirmacion";
import styles from "@/app/modules/ingresos/historial-ingresos.module.css";

const formatearMoneda = (valor: number) =>
  "$ " + valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatearPeso = (valor: number) =>
  valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kg";

const formatearFecha = (iso: string) => {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? iso : fecha.toLocaleString("es-CO");
};

const esDeHoy = (iso: string) => {
  const fecha = new Date(iso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
};

const TAMANO_PAGINA = 50;

interface FiltrosIngresos {
  fechaDesde: string;
  fechaHasta: string;
}

const FILTROS_VACIOS: FiltrosIngresos = { fechaDesde: "", fechaHasta: "" };

export function HistorialIngresos() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  // Filtros con los que se cargó la lista: la paginación usa estos, no los
  // que el usuario está editando sin aplicar.
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosIngresos>(FILTROS_VACIOS);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [pagoPendiente, setPagoPendiente] = useState<{ ingreso: Ingreso; metodo: MetodoPago } | null>(null);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [ingresoRecibo, setIngresoRecibo] = useState<Ingreso | null>(null);

  const cargarIngresos = useCallback(
    async (paginaSolicitada: number, filtros: FiltrosIngresos) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await obtenerHistorialIngresos({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setIngresos(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch (e) {
        setError("No se pudo cargar el historial de ingresos. Verifica la conexión con el servidor.");
        setIngresos([]);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  // Carga inicial al montar la página.
  useEffect(() => {
    cargarIngresos(0, FILTROS_VACIOS);
  }, [cargarIngresos]);

  const aplicarFiltros = (evento: React.FormEvent) => {
    evento.preventDefault();
    const filtros = { fechaDesde, fechaHasta };
    setFiltrosAplicados(filtros);
    cargarIngresos(0, filtros);
  };

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setFiltrosAplicados(FILTROS_VACIOS);
    cargarIngresos(0, FILTROS_VACIOS);
  };

  // Ejecuta un cambio sobre una fila y sincroniza solo esa fila con la respuesta.
  const ejecutarCambio = async (
    id: number,
    operacion: () => Promise<Ingreso>,
    mensajeExito: string,
    mensajeError: string,
  ) => {
    setActualizandoId(id);
    try {
      const actualizado = await operacion();
      setIngresos((previos) =>
        previos.map((ingreso) =>
          ingreso.id === actualizado.id
            ? {
                ...ingreso,
                estadoPago: actualizado.estadoPago,
                metodoPago: actualizado.metodoPago,
              }
            : ingreso,
        ),
      );
      toast.success(mensajeExito);
    } catch {
      toast.error(mensajeError);
    } finally {
      setActualizandoId(null);
    }
  };

  // El pago no se puede deshacer: elegir el método solo abre la confirmación.
  const confirmarPago = async () => {
    if (!pagoPendiente) return;
    const { ingreso, metodo } = pagoPendiente;
    await ejecutarCambio(
      ingreso.id,
      () => registrarPagoIngreso(ingreso.id, metodo),
      `Pago de ${ingreso.cliente} registrado (${ETIQUETA_METODO[metodo]}).`,
      "No se pudo registrar el pago. Intenta de nuevo.",
    );
    setPagoPendiente(null);
  };

  // Separa lo registrado hoy del resto del historial (solo aplica a la página 0)
  const ingresosHoy = ingresos.filter((ingreso) => esDeHoy(ingreso.fecha));
  const ingresosAnteriores = ingresos.filter((ingreso) => !esDeHoy(ingreso.fecha));
  // En páginas siguientes no se separa: se muestra la página completa tal cual llega.
  const ingresosVista = pagina === 0 ? ingresosAnteriores : ingresos;

  const propsTabla = {
    actualizandoId,
    onPagar: (ingreso: Ingreso, metodo: MetodoPago) => setPagoPendiente({ ingreso, metodo }),
    onVerRecibo: (ingreso: Ingreso) => {
      setIngresoRecibo(ingreso);
      setVisorAbierto(true);
    },
  };

  return (
    <div className={styles.contenedor}>
      <h1 className={styles.titulo}>Historial de ingresos</h1>
      <p className={styles.subtitulo}>
        Consulta los ingresos registrados filtrando por rango de fechas.
      </p>

      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campo}>
          <Label htmlFor="fechaDesde">Fecha desde</Label>
          <Input
            id="fechaDesde"
            type="date"
            className={styles.mono}
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className={styles.campo}>
          <Label htmlFor="fechaHasta">Fecha hasta</Label>
          <Input
            id="fechaHasta"
            type="date"
            className={styles.mono}
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className={styles.acciones}>
          <Button type="button" variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
          <Button type="submit" disabled={cargando}>
            {cargando ? "Buscando..." : "Filtrar"}
          </Button>
        </div>
      </form>

      {cargando ? (
        <div className={styles.tarjeta}>
          <div className={styles.estado}>Cargando ingresos...</div>
        </div>
      ) : error ? (
        <div className={styles.tarjeta}>
          <div className={`${styles.estado} ${styles.error}`}>{error}</div>
        </div>
      ) : (
        <>
          {/* La separación hoy/histórico solo tiene sentido en la primera página:
              en páginas siguientes ya no hay garantía de que "hoy" quede completo en esta página. */}
          {pagina === 0 && (
            <>
              <h2 className={styles.seccionTitulo}>
                Ingresos de hoy
                <span className={styles.seccionConteo}>{ingresosHoy.length}</span>
              </h2>
              <div className={styles.tarjeta} style={{ marginBottom: 28 }}>
                {ingresosHoy.length === 0 ? (
                  <div className={styles.estado}>Hoy no se han registrado ingresos.</div>
                ) : (
                  <TablaIngresos ingresos={ingresosHoy} {...propsTabla} />
                )}
              </div>
            </>
          )}

          <h2 className={styles.seccionTitulo}>
            {pagina === 0 ? "Historial general" : `Historial general · página ${pagina + 1}`}
            <span className={styles.seccionConteo}>
              {totalElementos} en total
            </span>
          </h2>
          <div className={styles.tarjeta}>
            {ingresosVista.length === 0 ? (
              <div className={styles.estado}>
                {pagina === 0
                  ? "No hay ingresos anteriores para el filtro seleccionado."
                  : "No hay ingresos en esta página."}
              </div>
            ) : (
              <TablaIngresos ingresos={ingresosVista} {...propsTabla} />
            )}
          </div>

          <div className={styles.paginacion}>
            <span>
              {totalElementos} ingresos en total · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
            </span>
            <div className={styles.controlesPagina}>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 0 || cargando}
                onClick={() => cargarIngresos(pagina - 1, filtrosAplicados)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= totalPaginas - 1 || cargando}
                onClick={() => cargarIngresos(pagina + 1, filtrosAplicados)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      <DialogoConfirmacion
        abierto={pagoPendiente !== null}
        titulo="¿Registrar el pago?"
        descripcion={
          pagoPendiente
            ? `Se registrará el pago de ${formatearMoneda(pagoPendiente.ingreso.total)} a ${pagoPendiente.ingreso.cliente} por ${ETIQUETA_METODO[pagoPendiente.metodo]}. Una vez registrado no se puede cambiar.`
            : ""
        }
        textoConfirmar="Registrar pago"
        textoProcesando="Registrando..."
        procesando={pagoPendiente !== null && actualizandoId === pagoPendiente.ingreso.id}
        alConfirmar={confirmarPago}
        alCancelar={() => setPagoPendiente(null)}
      />

      <VisorRecibo
        abierto={visorAbierto}
        onOpenChange={setVisorAbierto}
        titulo={`Recibo del ingreso de ${ingresoRecibo?.cliente ?? ""}`}
        cargarHtml={(signal) =>
          ingresoRecibo ? cargarHtmlReciboIngreso(ingresoRecibo.uuid, signal) : Promise.reject(new Error("Sin ingreso"))
        }
        onAbrirEnPestana={() => ingresoRecibo && imprimirRecibo(ingresoRecibo.uuid)}
      />
    </div>
  );
}

async function imprimirRecibo(uuid: string) {
  try {
    await abrirReciboIngresoPorUuid(uuid);
  } catch (e) {
    notificarErrorRecibo(e);
  }
}

interface PropsTablaIngresos {
  ingresos: Ingreso[];
  actualizandoId: number | null;
  onPagar: (ingreso: Ingreso, metodo: MetodoPago) => void;
  onVerRecibo: (ingreso: Ingreso) => void;
}

/** Tabla compartida por las dos secciones (hoy / historial general). */
function TablaIngresos({
  ingresos,
  actualizandoId,
  onPagar,
  onVerRecibo,
}: PropsTablaIngresos) {
  return (
    <div className={styles.tablaScroll}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Cédula</th>
            <th>Bodega</th>
            <th>Encargado</th>
            <th>Placa</th>
            <th className={styles.derecha}>Peso neto</th>
            <th className={styles.derecha}>Total</th>
            <th>Pago</th>
            <th>Recibo</th>
          </tr>
        </thead>
        <tbody>
          {ingresos.map((ingreso) => {
            const ocupada = actualizandoId === ingreso.id;
            return (
              <tr key={ingreso.id}>
                <td className={styles.mono}>{formatearFecha(ingreso.fecha)}</td>
                <td>{ingreso.cliente}</td>
                <td className={styles.mono}>{ingreso.cedula}</td>
                <td>{ingreso.bodegaDestino}</td>
                <td>{ingreso.encargado}</td>
                <td className={styles.mono}>{ingreso.placaVehiculo}</td>
                <td className={`${styles.mono} ${styles.derecha}`}>
                  {formatearPeso(ingreso.pesoNetoTotal)}
                </td>
                <td className={`${styles.mono} ${styles.derecha}`}>
                  {formatearMoneda(ingreso.total)}
                </td>
                <td>
                  <span className={styles.accionesPago}>
                    <ChipEstadoPago estadoPago={ingreso.estadoPago} metodoPago={ingreso.metodoPago} />
                    <select
                      className={styles.selectFila}
                      aria-label={`Método de pago del ingreso de ${ingreso.cliente}`}
                      value={ingreso.metodoPago ?? ""}
                      disabled={ocupada || ingreso.metodoPago !== null}
                      onChange={(e) => {
                        const metodo = e.target.value;
                        if (esMetodoPago(metodo)) onPagar(ingreso, metodo);
                      }}
                    >
                      <option value="" disabled>
                        Seleccionar
                      </option>
                      {METODOS_PAGO.map((metodo) => (
                        <option key={metodo} value={metodo}>
                          {ETIQUETA_METODO[metodo]}
                        </option>
                      ))}
                    </select>
                  </span>
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Ver recibo"
                    onClick={() => onVerRecibo(ingreso)}
                    aria-label={`Ver recibo del ingreso de ${ingreso.cliente}`}
                  >
                    <Eye size={15} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Imprimir recibo (abre una pestaña nueva)"
                    aria-label={`Imprimir recibo del ingreso de ${ingreso.cliente} en una pestaña nueva`}
                    onClick={() => imprimirRecibo(ingreso.uuid)}
                  >
                    <Printer size={15} aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
