import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { obtenerActividadDiaria, type ActividadDia } from "../servicios/dashboardApi";
import styles from "./home-view.module.css";

const RANGOS = [
  { valor: "7", etiqueta: "Últimos 7 días" },
  { valor: "15", etiqueta: "Últimos 15 días" },
  { valor: "30", etiqueta: "Últimos 30 días" },
];

const fmtPeso = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoneda = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatearDia(iso: string): string {
  const fecha = new Date(iso + "T00:00:00");
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short" });
}

function esHoy(iso: string): boolean {
  const hoy = new Date();
  const [a, m, d] = iso.split("-").map(Number);
  return a === hoy.getFullYear() && m === hoy.getMonth() + 1 && d === hoy.getDate();
}

export function HomeView() {
  const [dias, setDias] = useState("7");
  const [actividad, setActividad] = useState<ActividadDia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setActividad(await obtenerActividadDiaria(Number(dias)));
    } catch {
      setError("No se pudo cargar la actividad. Revisa la conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }, [dias]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totales = actividad.reduce(
    (acc, dia) => ({
      ingresos: acc.ingresos + dia.ingresos,
      pesoIngresado: acc.pesoIngresado + dia.pesoIngresadoKg,
      valor: acc.valor + dia.valorIngresos,
      entregas: acc.entregas + dia.entregas,
      pesoRecibido: acc.pesoRecibido + dia.pesoRecibidoKg,
    }),
    { ingresos: 0, pesoIngresado: 0, valor: 0, entregas: 0, pesoRecibido: 0 },
  );

  return (
    <div className={styles.contenedor}>
      <h1 className={styles.titulo}>Inicio</h1>
      <p className={styles.subtitulo}>
        Actividad diaria de la operación: ingresos en báscula y entregas recibidas.
      </p>

      <div className={styles.filtros}>
        <div className={styles.campo}>
          <Label>Rango</Label>
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGOS.map((r) => (
                <SelectItem key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.acciones}>
          <Button variant="outline" onClick={cargar} disabled={cargando}>
            <RefreshCw size={15} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className={styles.tarjeta}>
        {cargando ? (
          <div className={styles.estado}>Cargando actividad...</div>
        ) : error ? (
          <div className={`${styles.estado} ${styles.error}`}>{error}</div>
        ) : (
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Día</th>
                <th className={styles.derecha}>Ingresos</th>
                <th className={styles.derecha}>Peso ingresado (kg)</th>
                <th className={styles.derecha}>Valor ingresos ($)</th>
                <th className={styles.derecha}>Entregas</th>
                <th className={styles.derecha}>Peso recibido (kg)</th>
              </tr>
            </thead>
            <tbody>
              {actividad.map((dia) => {
                const sinActividad = dia.ingresos === 0 && dia.entregas === 0;
                return (
                  <tr key={dia.fecha} className={sinActividad ? styles.sinActividad : undefined}>
                    <td className={`${styles.mono} ${esHoy(dia.fecha) ? styles.hoy : ""}`}>
                      {formatearDia(dia.fecha)}
                      {esHoy(dia.fecha) && " · hoy"}
                    </td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{dia.ingresos}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{fmtPeso.format(dia.pesoIngresadoKg)}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{fmtMoneda.format(dia.valorIngresos)}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{dia.entregas}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{fmtPeso.format(dia.pesoRecibidoKg)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total del rango</td>
                <td className={`${styles.mono} ${styles.derecha}`}>{totales.ingresos}</td>
                <td className={`${styles.mono} ${styles.derecha}`}>{fmtPeso.format(totales.pesoIngresado)}</td>
                <td className={`${styles.mono} ${styles.derecha}`}>{fmtMoneda.format(totales.valor)}</td>
                <td className={`${styles.mono} ${styles.derecha}`}>{totales.entregas}</td>
                <td className={`${styles.mono} ${styles.derecha}`}>{fmtPeso.format(totales.pesoRecibido)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
