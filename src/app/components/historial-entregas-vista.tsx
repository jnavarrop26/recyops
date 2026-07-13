import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ChipEstadoEntrega } from "./chip-estado-entrega";
import {
  listarEntregas,
  abrirReciboEntrega,
  ESTADOS_ENTREGA,
  type Entrega,
} from "../servicios/entregasApi";
import { listarProveedores, type Proveedor } from "../servicios/proveedoresApi";
import { listarBodegas, type Bodega } from "../servicios/bodegasApi";
import styles from "./historial-entregas-vista.module.css";

const TAMANO_PAGINA = 50;
const TODOS = "__todos__";

const fmt = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtMes = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });
const fmtPeso = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

function clavesMes(entregas: Entrega[]): string[] {
  const visto = new Set<string>();
  const orden: string[] = [];
  for (const e of entregas) {
    const d = new Date(e.fechaRecepcion);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!visto.has(clave)) { visto.add(clave); orden.push(clave); }
  }
  return orden;
}

function etiquetaMes(clave: string): string {
  const [year, month] = clave.split("-").map(Number);
  return fmtMes.format(new Date(year, month - 1, 1));
}

function entregasDelMes(entregas: Entrega[], clave: string): Entrega[] {
  return entregas.filter((e) => {
    const d = new Date(e.fechaRecepcion);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === clave;
  });
}

export function HistorialEntregasVista() {
  const navegar = useNavigate();

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fBodega, setFBodega] = useState(TODOS);
  const [fProveedor, setFProveedor] = useState(TODOS);
  const [fEstado, setFEstado] = useState(TODOS);
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarEntregas({
          bodegaId: valor(fBodega),
          proveedorId: valor(fProveedor),
          estado: valor(fEstado),
          fechaDesde: fDesde || undefined,
          fechaHasta: fHasta || undefined,
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setEntregas(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el historial de entregas.");
        setEntregas([]);
      } finally {
        setCargando(false);
      }
    },
    [fBodega, fProveedor, fEstado, fDesde, fHasta],
  );

  useEffect(() => {
    (async () => {
      try {
        const [bs, ps] = await Promise.all([
          listarBodegas({ size: 200 }),
          listarProveedores({ size: 200 }),
        ]);
        setBodegas(bs.content);
        setProveedores(ps.content);
      } catch { /* sin filtros */ }
    })();
    cargar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    cargar(0);
  }

  function limpiar() {
    setFBodega(TODOS);
    setFProveedor(TODOS);
    setFEstado(TODOS);
    setFDesde("");
    setFHasta("");
  }

  async function verRecibo(entrega: Entrega) {
    try { await abrirReciboEntrega(entrega.id); }
    catch { setError("No se pudo generar el recibo."); }
  }

  // Métricas de la página actual
  const totalKg = entregas.reduce((s, e) => s + e.pesoKg, 0);
  const totalDespachadas = entregas.filter((e) => e.estado === "DESPACHADA").length;
  const proveedoresUnicos = new Set(entregas.map((e) => e.proveedorId)).size;

  const meses = clavesMes(entregas);

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Historial de entregas</h1>
          <p className={styles.subtitulo}>Registro cronológico de todas las recepciones de material.</p>
        </div>
      </div>

      {/* Filtros */}
      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campoFiltro}>
          <Label>Bodega</Label>
          <Select value={fBodega} onValueChange={setFBodega}>
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              {bodegas.map((b) => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label>Proveedor</Label>
          <Select value={fProveedor} onValueChange={setFProveedor}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {proveedores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label>Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {ESTADOS_ENTREGA.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="hDesde">Desde</Label>
          <Input id="hDesde" type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="hHasta">Hasta</Label>
          <Input id="hHasta" type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
        </div>
        <div className={styles.accionesFiltro}>
          <Button type="button" variant="outline" onClick={limpiar}>Limpiar</Button>
          <Button type="submit" disabled={cargando}>{cargando ? "Buscando..." : "Filtrar"}</Button>
        </div>
      </form>

      {/* Métricas */}
      {!cargando && entregas.length > 0 && (
        <div className={styles.metricas}>
          <div className={styles.metrica}>
            <p className={styles.metricaLabel}>Entregas en vista</p>
            <p className={styles.metricaValor}>{entregas.length}<span className={styles.metricaUnidad}>/ {totalElementos}</span></p>
          </div>
          <div className={styles.metrica}>
            <p className={styles.metricaLabel}>Total kg recibido</p>
            <p className={styles.metricaValor}>{fmtPeso.format(totalKg)}<span className={styles.metricaUnidad}>kg</span></p>
          </div>
          <div className={styles.metrica}>
            <p className={styles.metricaLabel}>Despachadas</p>
            <p className={styles.metricaValor}>{totalDespachadas}</p>
          </div>
          <div className={styles.metrica}>
            <p className={styles.metricaLabel}>Proveedores</p>
            <p className={styles.metricaValor}>{proveedoresUnicos}</p>
          </div>
        </div>
      )}

      {/* Timeline agrupada por mes */}
      {cargando ? (
        <div className={styles.tarjeta}><div className={styles.estado}>Cargando historial...</div></div>
      ) : error ? (
        <div className={styles.tarjeta}><div className={styles.estado}>{error}</div></div>
      ) : entregas.length === 0 ? (
        <div className={styles.tarjeta}><div className={styles.estado}>No se encontraron entregas con los filtros aplicados.</div></div>
      ) : (
        <div className={styles.timeline}>
          {meses.map((clave) => {
            const grupo = entregasDelMes(entregas, clave);
            return (
              <div key={clave} className={styles.mesGrupo}>
                <div className={styles.mesCabecera}>
                  <span className={styles.mesEtiqueta}>{etiquetaMes(clave)}</span>
                  <div className={styles.mesLinea} />
                  <span className={styles.mesCantidad}>{grupo.length} entrega{grupo.length !== 1 ? "s" : ""}</span>
                </div>

                <div className={styles.tarjeta}>
                  <table className={styles.tabla}>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Proveedor</th>
                        <th>Material</th>
                        <th className={styles.derecha}>Peso (kg)</th>
                        <th>Bodega</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.map((entrega) => (
                        <tr key={entrega.id}>
                          <td className={styles.mono}>{entrega.codigo}</td>
                          <td>{entrega.proveedorNombre}</td>
                          <td>{entrega.tipoMaterialNombre}</td>
                          <td className={`${styles.mono} ${styles.derecha}`}>
                            {fmtPeso.format(entrega.pesoKg)}
                          </td>
                          <td>{entrega.bodegaNombre}</td>
                          <td><ChipEstadoEntrega estado={entrega.estado} /></td>
                          <td className={styles.mono} style={{ fontSize: 12 }}>
                            {fmt.format(new Date(entrega.fechaRecepcion))}
                          </td>
                          <td>
                            <div className={styles.acciones}>
                              <Button variant="outline" size="sm" onClick={() => navegar(`/entregas/${entrega.id}`)}>Ver</Button>
                              <Button variant="outline" size="sm" onClick={() => verRecibo(entrega)}>Recibo</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className={styles.paginacion}>
            <span>{totalElementos} entregas en total · Página {pagina + 1} de {Math.max(totalPaginas, 1)}</span>
            <div className={styles.controlesPagina}>
              <Button variant="outline" size="sm" disabled={pagina <= 0 || cargando} onClick={() => cargar(pagina - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={pagina >= totalPaginas - 1 || cargando} onClick={() => cargar(pagina + 1)}>Siguiente</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
