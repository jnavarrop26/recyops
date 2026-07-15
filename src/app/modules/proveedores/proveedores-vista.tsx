import { useEffect, useState, useCallback } from "react";
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
import { ProveedorFormulario } from "@/app/modules/proveedores/proveedor-formulario";
import { EstrellasCalificacion } from "@/app/shared/components/estrellas-calificacion";
import {
  listarProveedores,
  cambiarEstadoProveedor,
  calificarProveedor,
  obtenerEntregasProveedor,
  ESTADOS_PROVEEDOR,
  type Proveedor,
  type EstadoProveedor,
  type EntregaProveedor,
} from "@/app/modules/proveedores/proveedoresApi";
import styles from "@/app/modules/proveedores/proveedores-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
}

function ChipEstadoProveedor({ estado }: { estado: EstadoProveedor }) {
  const clase =
    estado === "ACTIVO"
      ? styles.chipActivo
      : estado === "BLOQUEADO"
        ? styles.chipBloqueado
        : styles.chipInactivo;
  return <span className={`${styles.chip} ${clase}`}>{estado}</span>;
}

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
};

export function ProveedoresVista() {
  const admin = esAdmin();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fEstado, setFEstado] = useState(TODOS);
  const [fNombre, setFNombre] = useState("");
  const [fCalificacionMin, setFCalificacionMin] = useState(TODOS);

  // Modales
  const [modalForm, setModalForm] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);

  const [modalCalificar, setModalCalificar] = useState<Proveedor | null>(null);
  const [calificacionTemporal, setCalificacionTemporal] = useState(0);

  const [modalEntregas, setModalEntregas] = useState<Proveedor | null>(null);
  const [entregas, setEntregas] = useState<EntregaProveedor[]>([]);
  const [cargandoEntregas, setCargandoEntregas] = useState(false);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarProveedores({
          estado: valor(fEstado),
          nombre: fNombre.trim() || undefined,
          calificacionMin: valor(fCalificacionMin),
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setProveedores(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el listado de proveedores.");
        setProveedores([]);
      } finally {
        setCargando(false);
      }
    },
    [fEstado, fNombre, fCalificacionMin],
  );

  useEffect(() => {
    cargar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    cargar(0);
  }

  function limpiarFiltros() {
    setFEstado(TODOS);
    setFNombre("");
    setFCalificacionMin(TODOS);
  }

  function abrirCrear() {
    setProveedorEditando(null);
    setModalForm(true);
  }

  function abrirEditar(p: Proveedor) {
    setProveedorEditando(p);
    setModalForm(true);
  }

  function alGuardar() {
    setModalForm(false);
    cargar(pagina);
  }

  async function cambiarEstado(p: Proveedor, nuevoEstado: EstadoProveedor) {
    try {
      const actualizado = await cambiarEstadoProveedor(p.id, nuevoEstado);
      setProveedores((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, estado: actualizado.estado } : x)),
      );
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 403) setError("No tienes permisos para esta acción.");
      else if (s === 404) setError("El proveedor no existe o fue eliminado.");
      else setError("No se pudo cambiar el estado del proveedor.");
    }
  }

  function abrirCalificar(p: Proveedor) {
    setCalificacionTemporal(p.calificacion);
    setModalCalificar(p);
  }

  async function guardarCalificacion() {
    if (!modalCalificar) return;
    try {
      const actualizado = await calificarProveedor(modalCalificar.id, calificacionTemporal);
      setProveedores((prev) =>
        prev.map((x) => (x.id === modalCalificar.id ? { ...x, calificacion: actualizado.calificacion } : x)),
      );
      setModalCalificar(null);
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 400) setError("Revisa los datos del formulario.");
      else if (s === 403) setError("No tienes permisos para esta acción.");
      else if (s === 404) setError("El proveedor no existe o fue eliminado.");
      else setError("No se pudo guardar la calificación.");
      setModalCalificar(null);
    }
  }

  async function abrirEntregas(p: Proveedor) {
    setModalEntregas(p);
    setCargandoEntregas(true);
    setEntregas([]);
    try {
      const datos = await obtenerEntregasProveedor(p.id);
      setEntregas(datos);
    } catch {
      setEntregas([]);
    } finally {
      setCargandoEntregas(false);
    }
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Proveedores</h1>
          <p className={styles.subtitulo}>Gestión de proveedores de material reciclable.</p>
        </div>
        {admin && <Button onClick={abrirCrear}>Nuevo proveedor</Button>}
      </div>

      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fNombre">Nombre o NIT</Label>
          <Input id="fNombre" value={fNombre} onChange={(e) => setFNombre(e.target.value)} placeholder="Buscar..." />
        </div>
        <div className={styles.campoFiltro}>
          <Label>Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {ESTADOS_PROVEEDOR.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label>Calificación mínima</Label>
          <Select value={fCalificacionMin} onValueChange={setFCalificacionMin}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+ estrellas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className={styles.estado}>Cargando proveedores...</div>
        ) : error ? (
          <div className={styles.estado}>{error}</div>
        ) : proveedores.length === 0 ? (
          <div className={styles.estado}>No se encontraron proveedores.</div>
        ) : (
          <>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>NIT</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Calificación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td className={styles.mono}>{p.nit}</td>
                    <td>{p.contacto ?? "—"}</td>
                    <td className={styles.mono}>{p.telefono ?? "—"}</td>
                    <td><EstrellasCalificacion valor={p.calificacion} /></td>
                    <td><ChipEstadoProveedor estado={p.estado} /></td>
                    <td>
                      <div className={styles.acciones}>
                        <Button variant="outline" size="sm" onClick={() => abrirEntregas(p)}>
                          Entregas
                        </Button>
                        {admin && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => abrirEditar(p)}>
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => abrirCalificar(p)}>
                              Calificar
                            </Button>
                            <div className={styles.selectEstado}>
                              <Select value={p.estado} onValueChange={(v) => cambiarEstado(p, v as EstadoProveedor)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ESTADOS_PROVEEDOR.map((e) => (
                                    <SelectItem key={e} value={e}>
                                      {e}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.paginacion}>
              <span>
                {totalElementos} proveedores · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
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

      {/* Modal crear/editar */}
      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{proveedorEditando ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
            <DialogDescription>
              Los campos con * son obligatorios. El estado y la calificación se gestionan desde la tabla.
            </DialogDescription>
          </DialogHeader>
          <ProveedorFormulario
            proveedor={proveedorEditando}
            alGuardar={alGuardar}
            alCerrar={() => setModalForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal calificar */}
      <Dialog open={modalCalificar !== null} onOpenChange={(abierto) => !abierto && setModalCalificar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calificar proveedor</DialogTitle>
            <DialogDescription>{modalCalificar?.nombre}</DialogDescription>
          </DialogHeader>
          <div className={styles.calificarCaja}>
            <EstrellasCalificacion
              valor={calificacionTemporal}
              interactivo
              grande
              alCambiar={setCalificacionTemporal}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCalificar(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarCalificacion}>Guardar calificación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal entregas */}
      <Dialog open={modalEntregas !== null} onOpenChange={(abierto) => !abierto && setModalEntregas(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de entregas</DialogTitle>
            <DialogDescription>{modalEntregas?.nombre}</DialogDescription>
          </DialogHeader>
          {cargandoEntregas ? (
            <div className={styles.estado}>Cargando entregas...</div>
          ) : entregas.length === 0 ? (
            <div className={styles.estado}>Este proveedor no tiene entregas registradas.</div>
          ) : (
            <div className={styles.entregas}>
              {entregas.map((entrega) => (
                <div key={entrega.id} className={styles.entrega}>
                  <div className={styles.entregaInfo}>
                    <span className={styles.entregaCodigo}>{entrega.codigo}</span>
                    <span className={styles.entregaMeta}>
                      {entrega.tipoMaterialNombre} · {entrega.estado} · {formatearFecha(entrega.fechaRecepcion)}
                    </span>
                  </div>
                  <span className={styles.entregaPeso}>
                    {entrega.pesoKg.toLocaleString("es-CO")} kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
