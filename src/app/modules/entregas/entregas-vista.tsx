import { useEffect, useState, useCallback } from "react";
import { Printer } from "lucide-react";
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
import { abrirReciboEntrega } from "@/app/modules/entregas/recibo-entrega";
import { listarConvenios, type Convenio } from "@/app/modules/convenios/conveniosApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import styles from "@/app/modules/entregas/entregas-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
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

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  const [modalForm, setModalForm] = useState(false);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarEntregas({
          bodegaId: valor(fBodega),
          convenioId: valor(fConvenio),
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
        setError("No se pudo cargar el listado de entregas.");
        setEntregas([]);
      } finally {
        setCargando(false);
      }
    },
    [fBodega, fConvenio, fEstado, fDesde, fHasta],
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
    cargar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    cargar(0);
  }

  function limpiarFiltros() {
    setFBodega(TODOS);
    setFConvenio(TODOS);
    setFEstado(TODOS);
    setFDesde("");
    setFHasta("");
  }

  function alGuardar() {
    setModalForm(false);
    cargar(0);
  }

  async function descargarRecibo(entrega: Entrega) {
    try {
      await abrirReciboEntrega(entrega.id);
    } catch {
      setError("No se pudo generar el recibo.");
    }
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
          <Label>Bodega</Label>
          <Select value={fBodega} onValueChange={setFBodega}>
            <SelectTrigger>
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
          <Label>Convenio</Label>
          <Select value={fConvenio} onValueChange={setFConvenio}>
            <SelectTrigger>
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
          <Label>Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger>
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
                        title="Ver e imprimir recibo"
                        onClick={() => descargarRecibo(entrega)}
                      >
                        <Printer size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.paginacion}>
              <span>
                {totalElementos} entregas · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
              </span>
              <div className={styles.controlesPagina}>
                <Button variant="outline" size="sm" disabled={pagina <= 0 || cargando} onClick={() => cargar(pagina - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={pagina >= totalPaginas - 1 || cargando} onClick={() => cargar(pagina + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar entrega</DialogTitle>
            <DialogDescription>
              Solo se listan convenios, bodegas y trabajadores activos.
            </DialogDescription>
          </DialogHeader>
          <EntregaFormulario alGuardar={alGuardar} alCerrar={() => setModalForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
