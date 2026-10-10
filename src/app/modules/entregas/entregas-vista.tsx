import { useEffect, useState, useCallback } from "react";
import { Eye, Printer } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { EntregaFormulario } from "@/app/modules/entregas/entrega-formulario";
import { listarEntregas, ESTADOS_ENTREGA, type Entrega } from "@/app/modules/entregas/entregasApi";
import { abrirReciboEntrega, cargarHtmlReciboEntrega } from "@/app/modules/entregas/recibo-entrega";
import { VisorRecibo } from "@/app/shared/components/visor-recibo";
import { notificarErrorRecibo } from "@/app/shared/ventana-emergente";
import { listarConvenios, type Convenio } from "@/app/modules/convenios/conveniosApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import styles from "@/app/modules/entregas/entregas-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
};

interface FiltrosEntregas {
  bodega: string;
  convenio: string;
  estado: string;
  desde: string;
  hasta: string;
}

const FILTROS_INICIALES: FiltrosEntregas = {
  bodega: TODOS,
  convenio: TODOS,
  estado: TODOS,
  desde: "",
  hasta: "",
};

export function EntregasVista() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fBodega, setFBodega] = useState(TODOS);
  const [fConvenio, setFConvenio] = useState(TODOS);
  const [fEstado, setFEstado] = useState(TODOS);
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  // Filtros con los que se cargó la lista: paginar y recargar usan estos,
  // no los que el usuario está editando sin aplicar.
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosEntregas>(FILTROS_INICIALES);

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  const [modalForm, setModalForm] = useState(false);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [entregaRecibo, setEntregaRecibo] = useState<Entrega | null>(null);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number, filtros: FiltrosEntregas) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarEntregas({
          bodegaId: valor(filtros.bodega),
          convenioId: valor(filtros.convenio),
          estado: valor(filtros.estado),
          fechaDesde: filtros.desde || undefined,
          fechaHasta: filtros.hasta || undefined,
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setEntregas(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el listado de entregas.");
        setEntregas([]);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const [bs, cs] = await Promise.all([
          listarBodegas({ size: 100 }),
          listarConvenios({ size: 100 }),
        ]);
        setBodegas(bs.content);
        setConvenios(cs.content);
      } catch {
        /* filtros quedarán vacíos */
      }
    })();
    cargar(0, FILTROS_INICIALES);
  }, [cargar]);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    const filtros = { bodega: fBodega, convenio: fConvenio, estado: fEstado, desde: fDesde, hasta: fHasta };
    setFiltrosAplicados(filtros);
    cargar(0, filtros);
  }

  function limpiarFiltros() {
    setFBodega(TODOS);
    setFConvenio(TODOS);
    setFEstado(TODOS);
    setFDesde("");
    setFHasta("");
    setFiltrosAplicados(FILTROS_INICIALES);
    cargar(0, FILTROS_INICIALES);
  }

  // El listado se refresca apenas se registra; el modal se cierra al terminar la animación.
  function alRegistrar() {
    cargar(0, filtrosAplicados);
  }

  async function descargarRecibo(entrega: Entrega) {
    try {
      await abrirReciboEntrega(entrega.id);
    } catch (e) {
      notificarErrorRecibo(e);
    }
  }

  function verRecibo(entrega: Entrega) {
    setEntregaRecibo(entrega);
    setVisorAbierto(true);
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Entregas</h1>
          <p className={styles.subtitulo}>Recepción de material por convenio en bodega.</p>
        </div>
        <Button onClick={() => setModalForm(true)}>Registrar entrega</Button>
      </div>

      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fBodega">Bodega</Label>
          <Select value={fBodega} onValueChange={setFBodega}>
            <SelectTrigger id="fBodega">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              {bodegas.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fConvenio">Convenio</Label>
          <Select value={fConvenio} onValueChange={setFConvenio}>
            <SelectTrigger id="fConvenio">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {convenios.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fEstado">Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger id="fEstado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {ESTADOS_ENTREGA.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fDesde">Fecha desde</Label>
          <Input id="fDesde" type="date" className={styles.mono} value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fHasta">Fecha hasta</Label>
          <Input id="fHasta" type="date" className={styles.mono} value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
        </div>
        <div className={styles.accionesFiltro}>
          <Button type="button" variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
          <Button type="submit" disabled={cargando}>
            {cargando ? "Buscando..." : "Filtrar"}
          </Button>
        </div>
      </form>

      <div className={styles.tarjeta}>
        {cargando ? (
          <div className={styles.estado}>Cargando entregas...</div>
        ) : error ? (
          <div className={styles.estado}>{error}</div>
        ) : entregas.length === 0 ? (
          <div className={styles.estado}>No se encontraron entregas.</div>
        ) : (
          <>
            <div className={styles.tablaScroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Convenio</th>
                    <th>Persona que entrega</th>
                    <th className={styles.derecha}>Total (kg)</th>
                    <th>Bodega</th>
                    <th>Fecha</th>
                    <th>Recibo</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((entrega) => (
                    <tr key={entrega.id}>
                      <td className={styles.mono}>{entrega.codigo}</td>
                      <td>{entrega.convenioNombre ?? "—"}</td>
                      <td>{entrega.personaEntregaNombre ?? "—"}</td>
                      <td className={`${styles.mono} ${styles.derecha}`}>
                        {entrega.totalKg.toLocaleString("es-CO")}
                      </td>
                      <td>{entrega.bodegaNombre}</td>
                      <td className={styles.mono}>{formatearFecha(entrega.fechaRecepcion)}</td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Ver recibo"
                          onClick={() => verRecibo(entrega)}
                          aria-label={`Ver recibo de la entrega ${entrega.codigo}`}
                        >
                          <Eye size={15} aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Imprimir recibo (abre una pestaña nueva)"
                          onClick={() => descargarRecibo(entrega)}
                          aria-label={`Imprimir recibo de la entrega ${entrega.codigo} en una pestaña nueva`}
                        >
                          <Printer size={15} aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.paginacion}>
              <span>
                {totalElementos} entregas · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
              </span>
              <div className={styles.controlesPagina}>
                <Button variant="outline" size="sm" disabled={pagina <= 0 || cargando} onClick={() => cargar(pagina - 1, filtrosAplicados)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={pagina >= totalPaginas - 1 || cargando} onClick={() => cargar(pagina + 1, filtrosAplicados)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar entrega</DialogTitle>
            <DialogDescription>
              Solo se listan convenios, bodegas y trabajadores activos.
            </DialogDescription>
          </DialogHeader>
          <EntregaFormulario
            alRegistrar={alRegistrar}
            alGuardar={() => setModalForm(false)}
            alCerrar={() => setModalForm(false)}
          />
        </DialogContent>
      </Dialog>

      <VisorRecibo
        abierto={visorAbierto}
        onOpenChange={setVisorAbierto}
        titulo={`Recibo de la entrega ${entregaRecibo?.codigo ?? ""}`}
        cargarHtml={(signal) =>
          entregaRecibo ? cargarHtmlReciboEntrega(entregaRecibo.id, signal) : Promise.reject(new Error("Sin entrega"))
        }
        onAbrirEnPestana={() => entregaRecibo && descargarRecibo(entregaRecibo)}
      />
    </div>
  );
}
