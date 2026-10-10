import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
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
import { ProveedorFormulario } from "@/app/modules/proveedores/proveedor-formulario";
import {
  listarProveedores,
  cambiarEstadoProveedor,
  obtenerEntregasProveedor,
  ESTADOS_PROVEEDOR,
  type Proveedor,
  type EstadoProveedor,
  type EntregaProveedor,
} from "@/app/modules/proveedores/proveedoresApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import { DialogoConfirmacion } from "@/app/shared/components/dialogo-confirmacion";
import styles from "@/app/modules/proveedores/proveedores-vista.module.css";

interface FiltrosProveedores {
  estado: string;
  nombre: string;
}

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

function esAdmin(): boolean {
  return (localStorage.getItem("recyops_rol") || "").toUpperCase() === "ADMIN";
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
  // Filtros con los que se cargó la lista: paginar y recargar usan estos,
  // no los que el usuario está editando sin aplicar.
  const filtrosIniciales: FiltrosProveedores = { estado: TODOS, nombre: "" };
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosProveedores>(filtrosIniciales);
  const [cambioPendiente, setCambioPendiente] = useState<{ proveedor: Proveedor; estado: EstadoProveedor } | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // Modales
  const [modalForm, setModalForm] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);

  const [modalEntregas, setModalEntregas] = useState<Proveedor | null>(null);
  const [entregas, setEntregas] = useState<EntregaProveedor[]>([]);
  const [cargandoEntregas, setCargandoEntregas] = useState(false);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number, filtros: FiltrosProveedores) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarProveedores({
          estado: valor(filtros.estado),
          nombre: filtros.nombre.trim() || undefined,
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
    [],
  );

  useEffect(() => {
    cargar(0, { estado: TODOS, nombre: "" });
  }, [cargar]);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    const filtros = { estado: fEstado, nombre: fNombre };
    setFiltrosAplicados(filtros);
    cargar(0, filtros);
  }

  function limpiarFiltros() {
    setFEstado(TODOS);
    setFNombre("");
    setFiltrosAplicados(filtrosIniciales);
    cargar(0, filtrosIniciales);
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
    toast.success(proveedorEditando ? "Proveedor actualizado." : "Proveedor creado.");
    cargar(pagina, filtrosAplicados);
  }

  // Elegir un estado en la tabla solo abre la confirmación; el cambio se
  // aplica al confirmar.
  async function confirmarCambioEstado() {
    if (!cambioPendiente) return;
    const { proveedor: p, estado: nuevoEstado } = cambioPendiente;
    setCambiandoEstado(true);
    try {
      const actualizado = await cambiarEstadoProveedor(p.id, nuevoEstado);
      setProveedores((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, estado: actualizado.estado } : x)),
      );
      toast.success(`Proveedor ${p.nombre} ahora está ${actualizado.estado}.`);
    } catch (e) {
      toast.error(interpretarErrorHttp(e, {
        404: "El proveedor no existe o fue eliminado.",
      }, "No se pudo cambiar el estado del proveedor."));
    } finally {
      setCambiandoEstado(false);
      setCambioPendiente(null);
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
          <Label htmlFor="fEstado">Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger id="fEstado">
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
          <div className={styles.estado} role="alert">{error}</div>
        ) : proveedores.length === 0 ? (
          <div className={styles.estado}>No se encontraron proveedores.</div>
        ) : (
          <>
            <div className={styles.tablaScroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>NIT</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
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
                              <div className={styles.selectEstado}>
                                <Select
                                  value={p.estado}
                                  disabled={cambiandoEstado && cambioPendiente?.proveedor.id === p.id}
                                  onValueChange={(v) => {
                                    if (v !== p.estado) {
                                      setCambioPendiente({ proveedor: p, estado: v as EstadoProveedor });
                                    }
                                  }}
                                >
                                  <SelectTrigger aria-label={`Estado del proveedor ${p.nombre}`}>
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
            </div>

            <div className={styles.paginacion}>
              <span>
                {totalElementos} proveedores · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
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

      {/* Modal crear/editar */}
      <DialogoConfirmacion
        abierto={cambioPendiente !== null}
        titulo="¿Cambiar el estado del proveedor?"
        descripcion={
          cambioPendiente
            ? `El proveedor ${cambioPendiente.proveedor.nombre} pasará de ${cambioPendiente.proveedor.estado} a ${cambioPendiente.estado}.`
            : ""
        }
        textoConfirmar="Cambiar estado"
        textoProcesando="Cambiando..."
        destructivo={cambioPendiente !== null && cambioPendiente.estado !== "ACTIVO"}
        procesando={cambiandoEstado}
        alConfirmar={confirmarCambioEstado}
        alCancelar={() => setCambioPendiente(null)}
      />

      <Dialog open={modalForm} onOpenChange={setModalForm}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{proveedorEditando ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
            <DialogDescription>
              Los campos con * son obligatorios. El estado se gestiona desde la tabla.
            </DialogDescription>
          </DialogHeader>
          <ProveedorFormulario
            proveedor={proveedorEditando}
            alGuardar={alGuardar}
            alCerrar={() => setModalForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal entregas */}
      <Dialog open={modalEntregas !== null} onOpenChange={(abierto) => !abierto && setModalEntregas(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
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
                      {entrega.estado} · {formatearFecha(entrega.fechaRecepcion)}
                    </span>
                  </div>
                  <span className={styles.entregaPeso}>
                    {entrega.totalKg.toLocaleString("es-CO")} kg
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
