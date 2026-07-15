import { useEffect, useState, useCallback } from "react";
import { Printer } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { obtenerHistorialIngresos, type Ingreso } from "@/app/modules/ingresos/ingresosApi";
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

  // Separa lo registrado hoy del resto del historial
  const ingresosHoy = ingresos.filter((ingreso) => esDeHoy(ingreso.fecha));
  const ingresosAnteriores = ingresos.filter((ingreso) => !esDeHoy(ingreso.fecha));

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
          <h2 className={styles.seccionTitulo}>
            Ingresos de hoy
            <span className={styles.seccionConteo}>{ingresosHoy.length}</span>
          </h2>
          <div className={styles.tarjeta} style={{ marginBottom: 28 }}>
            {ingresosHoy.length === 0 ? (
              <div className={styles.estado}>Hoy no se han registrado ingresos.</div>
            ) : (
              <TablaIngresos ingresos={ingresosHoy} />
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
              <TablaIngresos ingresos={ingresosAnteriores} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Tabla compartida por las dos secciones (hoy / historial general). */
function TablaIngresos({ ingresos }: { ingresos: Ingreso[] }) {
  return (
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
          <th>Recibo</th>
        </tr>
      </thead>
      <tbody>
        {ingresos.map((ingreso) => (
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
            <td>{ingreso.estado}</td>
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
        ))}
      </tbody>
    </table>
  );
}
