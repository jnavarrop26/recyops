import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { EntregaFormulario } from "@/app/modules/entregas/entrega-formulario";
import { ChipEstadoEntrega } from "@/app/modules/entregas/chip-estado-entrega";
import {
  listarEntregas,
  cambiarEstadoEntrega,
  eliminarEntrega,
  abrirReciboEntrega,
  siguienteEstado,
  ESTADOS_ENTREGA,
  type Entrega,
} from "@/app/modules/entregas/entregasApi";
import { listarProveedores, type Proveedor } from "@/app/modules/proveedores/proveedoresApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import styles from "@/app/modules/entregas/entregas-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
}

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
};

export function EntregasVista() {
  const admin = esAdmin();
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

  const [modalForm, setModalForm] = useState(false);
  const [entregaEliminar, setEntregaEliminar] = useState<Entrega | null>(null);

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
        setError("No se pudo cargar el listado de entregas.");
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
          listarBodegas({ size: 100 }),
          listarProveedores({ size: 100 }),
        ]);
        setBodegas(bs.content);
        setProveedores(ps.content);
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
    setFProveedor(TODOS);
    setFEstado(TODOS);
    setFDesde("");
    setFHasta("");
  }

  function alGuardar() {
    setModalForm(false);
    cargar(0);
  }

  async function avanzarEstado(entrega: Entrega) {
    const siguiente = siguienteEstado(entrega.estado);
    if (!siguiente) return;
    try {
      const actualizada = await cambiarEstadoEntrega(entrega.id, siguiente);
      setEntregas((prev) => prev.map((e) => (e.id === entrega.id ? { ...e, estado: actualizada.estado } : e)));
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 409 || s === 400) setError("Transición de estado no permitida.");
      else if (s === 403) setError("No tienes permisos para esta acción.");
      else if (s === 404) setError("Registro no encontrado.");
      else setError("No se pudo cambiar el estado de la entrega.");
    }
  }

  async function descargarRecibo(entrega: Entrega) {
    try {
      await abrirReciboEntrega(entrega.id);
    } catch {
      setError("No se pudo generar el recibo.");
    }
  }

  async function confirmarEliminar() {
    if (!entregaEliminar) return;
    try {
      await eliminarEntrega(entregaEliminar.id);
      setEntregaEliminar(null);
      cargar(pagina);
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 409) setError("No se puede eliminar una entrega ya procesada.");
      else if (s === 403) setError("No tienes permisos para esta acción.");
      else if (s === 404) setError("Registro no encontrado.");
      else setError("No se pudo eliminar la entrega.");
      setEntregaEliminar(null);
    }
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Entregas</h1>
          <p className={styles.subtitulo}>Recepción de material de proveedores en bodega.</p>
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
          <Label>Proveedor</Label>
          <Select value={fProveedor} onValueChange={setFProveedor}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
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
                {entregas.map((entrega) => {
                  const siguiente = siguienteEstado(entrega.estado);
                  return (
                    <tr key={entrega.id}>
                      <td className={styles.mono}>{entrega.codigo}</td>
                      <td>{entrega.proveedorNombre}</td>
                      <td>{entrega.tipoMaterialNombre}</td>
                      <td className={`${styles.mono} ${styles.derecha}`}>
                        {entrega.pesoKg.toLocaleString("es-CO")}
                      </td>
                      <td>{entrega.bodegaNombre}</td>
                      <td><ChipEstadoEntrega estado={entrega.estado} /></td>
                      <td className={styles.mono}>{formatearFecha(entrega.fechaRecepcion)}</td>
                      <td>
                        <div className={styles.acciones}>
                          <Button variant="outline" size="sm" onClick={() => navegar(`/entregas/${entrega.id}`)}>
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => descargarRecibo(entrega)}>
                            Recibo
                          </Button>
                          {siguiente && (
                            <Button variant="outline" size="sm" onClick={() => avanzarEstado(entrega)}>
                              → {siguiente}
                            </Button>
                          )}
                          {admin && (
                            <Button variant="outline" size="sm" onClick={() => setEntregaEliminar(entrega)}>
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              Solo se listan proveedores, bodegas y materiales activos.
            </DialogDescription>
          </DialogHeader>
          <EntregaFormulario alGuardar={alGuardar} alCerrar={() => setModalForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={entregaEliminar !== null} onOpenChange={(abierto) => !abierto && setEntregaEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar entrega</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar la entrega {entregaEliminar?.codigo}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregaEliminar(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarEliminar}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
