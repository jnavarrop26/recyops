import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
import { BodegaFormulario } from "@/app/modules/bodega/bodega-formulario";
import { ChipEstado } from "@/app/modules/bodega/bodega-ui";
import {
  listarBodegas,
  cambiarEstadoBodega,
  ESTADOS_BODEGA,
  TIPOS_ORGANIZACION,
  type Bodega,
  type EstadoBodega,
} from "@/app/modules/bodega/bodegasApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import { DialogoConfirmacion } from "@/app/shared/components/dialogo-confirmacion";
import styles from "@/app/modules/bodega/bodegas-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

interface FiltrosBodegas {
  estado: string;
  tipo: string;
  nombre: string;
}

const FILTROS_INICIALES: FiltrosBodegas = { estado: TODOS, tipo: TODOS, nombre: "" };

function esAdmin(): boolean {
  return (localStorage.getItem("recyops_rol") || "").toUpperCase() === "ADMIN";
}

export function BodegasVista() {
  const admin = esAdmin();
  const navegar = useNavigate();

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fEstado, setFEstado] = useState(TODOS);
  const [fTipo, setFTipo] = useState(TODOS);
  const [fNombre, setFNombre] = useState("");
  // Filtros con los que se cargó la lista: paginar y recargar usan estos,
  // no los que el usuario está editando sin aplicar.
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosBodegas>(FILTROS_INICIALES);
  const [cambioPendiente, setCambioPendiente] = useState<{ bodega: Bodega; estado: EstadoBodega } | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [bodegaEditando, setBodegaEditando] = useState<Bodega | null>(null);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number, filtros: FiltrosBodegas) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarBodegas({
          estado: valor(filtros.estado),
          tipoOrganizacion: valor(filtros.tipo),
          nombre: filtros.nombre.trim() || undefined,
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setBodegas(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el listado de bodegas.");
        setBodegas([]);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargar(0, FILTROS_INICIALES);
  }, [cargar]);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    const filtros = { estado: fEstado, tipo: fTipo, nombre: fNombre };
    setFiltrosAplicados(filtros);
    cargar(0, filtros);
  }

  function limpiarFiltros() {
    setFEstado(TODOS);
    setFTipo(TODOS);
    setFNombre("");
    setFiltrosAplicados(FILTROS_INICIALES);
    cargar(0, FILTROS_INICIALES);
  }

  function abrirCrear() {
    setBodegaEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(bodega: Bodega) {
    setBodegaEditando(bodega);
    setModalAbierto(true);
  }

  function alGuardar() {
    setModalAbierto(false);
    toast.success(bodegaEditando ? "Bodega actualizada." : "Bodega creada.");
    cargar(pagina, filtrosAplicados);
  }

  // Elegir un estado en la tabla solo abre la confirmación; el cambio se
  // aplica al confirmar.
  async function confirmarCambioEstado() {
    if (!cambioPendiente) return;
    const { bodega, estado: nuevoEstado } = cambioPendiente;
    setCambiandoEstado(true);
    try {
      const actualizada = await cambiarEstadoBodega(bodega.id, nuevoEstado);
      setBodegas((previas) =>
        previas.map((b) => (b.id === bodega.id ? { ...b, estado: actualizada.estado } : b)),
      );
      toast.success(`Bodega ${bodega.nombre} ahora está ${actualizada.estado}.`);
    } catch (e) {
      toast.error(interpretarErrorHttp(e, {
        404: "La bodega no existe o fue eliminada.",
      }, "No se pudo cambiar el estado de la bodega."));
    } finally {
      setCambiandoEstado(false);
      setCambioPendiente(null);
    }
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Bodegas</h1>
          <p className={styles.subtitulo}>Administración de bodegas y su ocupación.</p>
        </div>
        {admin && <Button onClick={abrirCrear}>Nueva bodega</Button>}
      </div>

      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fNombre">Nombre</Label>
          <Input
            id="fNombre"
            value={fNombre}
            onChange={(e) => setFNombre(e.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fEstado">Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger id="fEstado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {ESTADOS_BODEGA.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fTipo">Tipo de organización</Label>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger id="fTipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {TIPOS_ORGANIZACION.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
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
          <div className={styles.estado}>Cargando bodegas...</div>
        ) : error ? (
          <div className={styles.estado} role="alert">{error}</div>
        ) : bodegas.length === 0 ? (
          <div className={styles.estado}>No se encontraron bodegas.</div>
        ) : (
          <>
            <div className={styles.tablaScroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bodegas.map((bodega) => (
                    <tr key={bodega.id}>
                      <td>{bodega.nombre}</td>
                      <td>{bodega.tipoOrganizacion}</td>
                      <td>{bodega.direccion}</td>
                      <td className={styles.mono}>{bodega.telefono || "—"}</td>
                      <td><ChipEstado estado={bodega.estado} /></td>
                      <td>
                        <div className={styles.acciones}>
                          <Button variant="outline" size="sm" onClick={() => navegar(`/bodegas/${bodega.id}`)}>
                            Ver
                          </Button>
                          {admin && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => abrirEditar(bodega)}>
                                Editar
                              </Button>
                              <div className={styles.selectEstado}>
                                <Select
                                  value={bodega.estado}
                                  disabled={cambiandoEstado && cambioPendiente?.bodega.id === bodega.id}
                                  onValueChange={(v) => {
                                    if (v !== bodega.estado) {
                                      setCambioPendiente({ bodega, estado: v as EstadoBodega });
                                    }
                                  }}
                                >
                                  <SelectTrigger aria-label={`Estado de la bodega ${bodega.nombre}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ESTADOS_BODEGA.map((e) => (
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
                {totalElementos} bodegas · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
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

      <DialogoConfirmacion
        abierto={cambioPendiente !== null}
        titulo="¿Cambiar el estado de la bodega?"
        descripcion={
          cambioPendiente
            ? `La bodega ${cambioPendiente.bodega.nombre} pasará de ${cambioPendiente.bodega.estado} a ${cambioPendiente.estado}.`
            : ""
        }
        textoConfirmar="Cambiar estado"
        textoProcesando="Cambiando..."
        destructivo={cambioPendiente !== null && cambioPendiente.estado !== "ACTIVA"}
        procesando={cambiandoEstado}
        alConfirmar={confirmarCambioEstado}
        alCancelar={() => setCambioPendiente(null)}
      />

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bodegaEditando ? "Editar bodega" : "Nueva bodega"}</DialogTitle>
            <DialogDescription>
              Los campos con * son obligatorios. El estado se gestiona desde la tabla.
            </DialogDescription>
          </DialogHeader>
          <BodegaFormulario bodega={bodegaEditando} alGuardar={alGuardar} alCerrar={() => setModalAbierto(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
