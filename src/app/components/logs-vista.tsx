import { Fragment, useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ARCHIVOS_LOG,
  type ArchivoLog,
  type LineaLog,
  obtenerLogs,
} from "../servicios/logsApi";
import styles from "./logs-vista.module.css";

const NIVELES = ["TODOS", "DEBUG", "INFO", "WARN", "ERROR"] as const;

function claseNivel(nivel: string) {
  switch (nivel) {
    case "ERROR":
      return styles.nivelERROR;
    case "WARN":
      return styles.nivelWARN;
    case "DEBUG":
      return styles.nivelDEBUG;
    default:
      return styles.nivelINFO;
  }
}

export function LogsVista() {
  const [archivo, setArchivo] = useState<ArchivoLog>("GENERAL");
  const [nivel, setNivel] = useState<(typeof NIVELES)[number]>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [lineas, setLineas] = useState<LineaLog[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setExpandida(null);
    try {
      setLineas(await obtenerLogs(archivo, 300));
    } catch {
      setError("No se pudieron cargar los logs. Revisa la conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }, [archivo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const texto = busqueda.trim().toLowerCase();
  const visibles = lineas.filter(
    (l) =>
      (nivel === "TODOS" || l.nivel === nivel) &&
      (texto === "" ||
        l.mensaje.toLowerCase().includes(texto) ||
        l.usuario.toLowerCase().includes(texto) ||
        l.logger.toLowerCase().includes(texto)),
  );

  return (
    <div className={styles.contenedor}>
      <h1 className={styles.titulo}>Logs</h1>
      <p className={styles.subtitulo}>
        Historial de actividad del sistema. Cada archivo rota al llegar a 20 MB.
      </p>

      <div className={styles.filtros}>
        <div className={styles.campo}>
          <Label>Archivo</Label>
          <Select value={archivo} onValueChange={(v) => setArchivo(v as ArchivoLog)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARCHIVOS_LOG.map((a) => (
                <SelectItem key={a.valor} value={a.valor}>
                  {a.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.campo}>
          <Label>Nivel</Label>
          <Select value={nivel} onValueChange={(v) => setNivel(v as (typeof NIVELES)[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NIVELES.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.campo}>
          <Label htmlFor="busqueda-logs">Buscar</Label>
          <Input
            id="busqueda-logs"
            placeholder="Mensaje, usuario o clase..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
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
          <div className={styles.estado}>Cargando logs...</div>
        ) : error ? (
          <div className={`${styles.estado} ${styles.error}`}>{error}</div>
        ) : visibles.length === 0 ? (
          <div className={styles.estado}>No hay entradas para el filtro seleccionado.</div>
        ) : (
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nivel</th>
                <th>Usuario</th>
                <th>Empresa</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((l, i) => (
                <Fragment key={`${l.fecha}-${i}`}>
                  <tr
                    className={l.detalle ? styles.filaClicable : undefined}
                    onClick={() => l.detalle && setExpandida(expandida === i ? null : i)}
                    title={l.detalle ? "Clic para ver el detalle completo" : undefined}
                  >
                    <td className={styles.mono}>{l.fecha}</td>
                    <td>
                      <span className={`${styles.nivel} ${claseNivel(l.nivel)}`}>{l.nivel}</span>
                    </td>
                    <td className={styles.mono}>{l.usuario || "—"}</td>
                    <td className={styles.mono}>{l.empresa || "—"}</td>
                    <td className={styles.mensaje}>
                      {l.mensaje}
                      {l.detalle && expandida !== i && " …"}
                    </td>
                  </tr>
                  {l.detalle && expandida === i && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <pre className={styles.detalle}>{l.detalle}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
