import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  ARCHIVOS_LOG,
  type ArchivoLog,
  type LineaLog,
  obtenerLogs,
} from "@/app/modules/logs/logsApi";
import { usePeticionCancelable } from "@/app/shared/hooks/use-peticion-cancelable";
import styles from "@/app/modules/logs/logs-vista.module.css";

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
  // Clave estable de la fila expandida (no un índice en la lista filtrada,
  // que cambia al buscar o filtrar por nivel).
  const [expandida, setExpandida] = useState<string | null>(null);

  const nuevaPeticion = usePeticionCancelable();

  // Cambiar de archivo rápido cancela la petición anterior.
  const cargar = useCallback(async () => {
    const signal = nuevaPeticion();
    setCargando(true);
    setError(null);
    setExpandida(null);
    try {
      const datos = await obtenerLogs(archivo, 300, signal);
      if (!signal.aborted) setLineas(datos);
    } catch {
      if (!signal.aborted) {
        setError("No se pudieron cargar los logs. Revisa la conexión con el servidor.");
      }
    } finally {
      if (!signal.aborted) setCargando(false);
    }
  }, [archivo, nuevaPeticion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // La posición en la respuesta completa identifica la línea mientras no se
  // recargue (recargar ya colapsa la fila expandida).
  const lineasConClave = useMemo(
    () => lineas.map((l, i) => ({ ...l, clave: `${i}-${l.fecha}` })),
    [lineas],
  );

  const texto = busqueda.trim().toLowerCase();
  const visibles = lineasConClave.filter(
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
          <Label htmlFor="archivo-logs">Archivo</Label>
          <Select value={archivo} onValueChange={(v) => setArchivo(v as ArchivoLog)}>
            <SelectTrigger id="archivo-logs">
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
          <Label htmlFor="nivel-logs">Nivel</Label>
          <Select value={nivel} onValueChange={(v) => setNivel(v as (typeof NIVELES)[number])}>
            <SelectTrigger id="nivel-logs">
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
            <RefreshCw size={15} aria-hidden="true" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className={styles.tarjeta}>
        {cargando ? (
          <div className={styles.estado}>Cargando logs...</div>
        ) : error ? (
          <div className={`${styles.estado} ${styles.error}`} role="alert">{error}</div>
        ) : visibles.length === 0 ? (
          <div className={styles.estado}>No hay entradas para el filtro seleccionado.</div>
        ) : (
          <div className={styles.tablaScroll}>
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
                {visibles.map((l) => (
                  <Fragment key={l.clave}>
                    <tr
                      className={l.detalle ? styles.filaClicable : undefined}
                      onClick={() => l.detalle && setExpandida(expandida === l.clave ? null : l.clave)}
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
                        {l.detalle && expandida !== l.clave && " …"}
                      </td>
                    </tr>
                    {l.detalle && expandida === l.clave && (
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
          </div>
        )}
      </div>
    </div>
  );
}
