import { useEffect, useState, useCallback } from "react";
import { Printer } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  obtenerHistorialIngresos,
  registrarPagoIngreso,
  cambiarEstadoIngreso,
  cambiarPasoIngreso,
  esEstadoIngreso,
  esMetodoPago,
  ESTADOS_INGRESO,
  ETIQUETA_ESTADO_INGRESO,
  METODOS_PAGO,
  type Ingreso,
  type EstadoIngreso,
  type MetodoPago,
} from "@/app/modules/ingresos/ingresosApi";
import { ChipEstadoPago, ETIQUETA_METODO } from "@/app/modules/ingresos/chip-estado-pago";
import { abrirReciboIngresoPorUuid } from "@/app/modules/ingresos/recibo-ingreso";
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

export function HistorialIngresos() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);

  const cargarIngresos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerHistorialIngresos({ fechaDesde, fechaHasta });
      setIngresos(Array.isArray(datos) ? datos : []);
    } catch (e) {
      setError("No se pudo cargar el historial de ingresos. Verifica la conexión con el servidor.");
      setIngresos([]);
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta]);

  // Carga inicial al montar la página.
  useEffect(() => {
    cargarIngresos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltros = (evento: React.FormEvent) => {
    evento.preventDefault();
    cargarIngresos();
  };

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
  };

  // Ejecuta un cambio sobre una fila y sincroniza solo esa fila con la respuesta.
  const ejecutarCambio = async (
    id: number,
    operacion: () => Promise<Ingreso>,
    mensajeError: string,
  ) => {
    setActualizandoId(id);
    setErrorCambio(null);
    try {
      const actualizado = await operacion();
      setIngresos((previos) =>
        previos.map((ingreso) =>
          ingreso.id === actualizado.id
            ? {
                ...ingreso,
                estado: actualizado.estado,
                estadoPago: actualizado.estadoPago,
                metodoPago: actualizado.metodoPago,
                paso: actualizado.paso,
              }
            : ingreso,
        ),
      );
    } catch {
      setErrorCambio(mensajeError);
    } finally {
      setActualizandoId(null);
    }
  };

  const pagarIngreso = (id: number, metodo: MetodoPago) =>
    ejecutarCambio(
      id,
      () => registrarPagoIngreso(id, metodo),
      "No se pudo registrar el pago. Intenta de nuevo.",
    );

  const cambiarEstado = (id: number, estado: EstadoIngreso) =>
    ejecutarCambio(
      id,
      () => cambiarEstadoIngreso(id, estado),
      "No se pudo cambiar el estado. Intenta de nuevo.",
    );

  const cambiarPaso = (id: number, valor: boolean) =>
    ejecutarCambio(
      id,
      () => cambiarPasoIngreso(id, valor),
      "No se pudo actualizar la marca de paso. Intenta de nuevo.",
    );

  // Separa lo registrado hoy del resto del historial
  const ingresosHoy = ingresos.filter((ingreso) => esDeHoy(ingreso.fecha));
  const ingresosAnteriores = ingresos.filter((ingreso) => !esDeHoy(ingreso.fecha));

  const propsTabla = {
    actualizandoId,
    onPagar: pagarIngreso,
    onCambiarEstado: cambiarEstado,
    onCambiarPaso: cambiarPaso,
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
          {errorCambio && (
            <div className={`${styles.estado} ${styles.error}`} role="alert">
              {errorCambio}
            </div>
          )}
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

          <h2 className={styles.seccionTitulo}>
            Historial general
            <span className={styles.seccionConteo}>{ingresosAnteriores.length}</span>
          </h2>
          <div className={styles.tarjeta}>
            {ingresosAnteriores.length === 0 ? (
              <div className={styles.estado}>
                No hay ingresos anteriores para el filtro seleccionado.
              </div>
            ) : (
              <TablaIngresos ingresos={ingresosAnteriores} {...propsTabla} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface PropsTablaIngresos {
  ingresos: Ingreso[];
  actualizandoId: number | null;
  onPagar: (id: number, metodo: MetodoPago) => void;
  onCambiarEstado: (id: number, estado: EstadoIngreso) => void;
  onCambiarPaso: (id: number, valor: boolean) => void;
}

/** Tabla compartida por las dos secciones (hoy / historial general). */
function TablaIngresos({
  ingresos,
  actualizandoId,
  onPagar,
  onCambiarEstado,
  onCambiarPaso,
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
            <th>Estado</th>
            <th>Pago</th>
            <th>Paso</th>
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
                  <select
                    className={styles.selectFila}
                    aria-label="Cambiar estado del ingreso"
                    value={esEstadoIngreso(ingreso.estado) ? ingreso.estado : ""}
                    disabled={ocupada}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (esEstadoIngreso(valor)) onCambiarEstado(ingreso.id, valor);
                    }}
                  >
                    {ESTADOS_INGRESO.map((estado) => (
                      <option key={estado} value={estado}>
                        {ETIQUETA_ESTADO_INGRESO[estado]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {ingreso.estadoPago === "PAGADO" ? (
                    <span className={styles.accionesPago}>
                      <ChipEstadoPago estadoPago={ingreso.estadoPago} metodoPago={null} />
                      <select
                        className={styles.selectFila}
                        aria-label="Cambiar método de pago"
                        value={ingreso.metodoPago ?? ""}
                        disabled={ocupada}
                        onChange={(e) => {
                          const metodo = e.target.value;
                          if (esMetodoPago(metodo)) onPagar(ingreso.id, metodo);
                        }}
                      >
                        {METODOS_PAGO.map((metodo) => (
                          <option key={metodo} value={metodo}>
                            {ETIQUETA_METODO[metodo]}
                          </option>
                        ))}
                      </select>
                    </span>
                  ) : (
                    <span className={styles.accionesPago}>
                      <ChipEstadoPago estadoPago={ingreso.estadoPago} metodoPago={null} />
                      {METODOS_PAGO.map((metodo) => (
                        <Button
                          key={metodo}
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={ocupada}
                          title={`Marcar pagado con ${ETIQUETA_METODO[metodo].toLowerCase()}`}
                          onClick={() => onPagar(ingreso.id, metodo)}
                        >
                          {ETIQUETA_METODO[metodo]}
                        </Button>
                      ))}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={`${styles.chipPaso} ${ingreso.paso ? styles.chipPasoSi : ""}`}
                    aria-pressed={ingreso.paso}
                    disabled={ocupada}
                    title={ingreso.paso ? "Marcar como no pasó" : "Marcar como pasó"}
                    onClick={() => onCambiarPaso(ingreso.id, !ingreso.paso)}
                  >
                    {ingreso.paso ? "Sí" : "No"}
                  </button>
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Imprimir recibo"
                    onClick={() => abrirReciboIngresoPorUuid(ingreso.uuid)}
                  >
                    <Printer size={15} />
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
