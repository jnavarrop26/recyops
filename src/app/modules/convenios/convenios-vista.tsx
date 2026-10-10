import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import {
  listarConvenios,
  cambiarEstadoConvenio,
  ESTADOS_CONVENIO,
  TIPOS_CONVENIO,
  type Convenio,
  type EstadoConvenio,
} from "@/app/modules/convenios/conveniosApi";
import { ConvenioFormulario } from "@/app/modules/convenios/convenio-formulario";
import { interpretarErrorHttp } from "@/app/http/errores";
import styles from "@/app/modules/convenios/convenios-vista.module.css";

interface FiltrosConvenios {
  estado: string;
  tipo: string;
  nombre: string;
}

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

const ETIQUETAS_TIPO: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  INTERCAMBIO: "Intercambio",
  SERVICIO: "Servicio",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  VENCIDO: "Vencido",
  SUSPENDIDO: "Suspendido",
};

function esAdmin(): boolean {
  return (localStorage.getItem("recyops_rol") || "").toUpperCase() === "ADMIN";
}

function chipEstado(estado: EstadoConvenio) {
  const clase =
    estado === "ACTIVO"
      ? styles.chipActivo
      : estado === "INACTIVO"
        ? styles.chipInactivo
        : estado === "VENCIDO"
          ? styles.chipVencido
          : styles.chipSuspendido;
  return (
    <span className={`${styles.chip} ${clase}`}>{ETIQUETAS_ESTADO[estado] ?? estado}</span>
  );
}

function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function formatearValor(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
}

export function ConveniosVista() {
  const admin = esAdmin();

  const [convenios, setConvenios] = useState<Convenio[]>([]);
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
  const filtrosIniciales: FiltrosConvenios = { estado: TODOS, tipo: TODOS, nombre: "" };
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosConvenios>(filtrosIniciales);

  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [convenioEditando, setConvenioEditando] = useState<Convenio | null>(null);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [convenioEstado, setConvenioEstado] = useState<Convenio | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number, filtros: FiltrosConvenios) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarConvenios({
          estado: valor(filtros.estado),
          tipo: valor(filtros.tipo),
          nombre: filtros.nombre.trim() || undefined,
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setConvenios(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el listado de convenios.");
        setConvenios([]);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargar(0, { estado: TODOS, tipo: TODOS, nombre: "" });
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
    setFiltrosAplicados(filtrosIniciales);
    cargar(0, filtrosIniciales);
  }

  function abrirCrear() {
    setConvenioEditando(null);
    setModalFormAbierto(true);
  }

  function abrirEditar(c: Convenio) {
    setConvenioEditando(c);
    setModalFormAbierto(true);
  }

  function alGuardar() {
    setModalFormAbierto(false);
    toast.success(convenioEditando ? "Convenio actualizado." : "Convenio creado.");
    cargar(pagina, filtrosAplicados);
  }

  function abrirCambiarEstado(c: Convenio) {
    setConvenioEstado(c);
    setErrorEstado(null);
    setModalEstadoAbierto(true);
  }

  async function ejecutarCambioEstado(nuevoEstado: EstadoConvenio) {
    if (!convenioEstado) return;
    setCambiandoEstado(true);
    setErrorEstado(null);
    try {
      await cambiarEstadoConvenio(convenioEstado.id, nuevoEstado);
      setModalEstadoAbierto(false);
      toast.success(`Convenio ${convenioEstado.nombre} ahora está ${ETIQUETAS_ESTADO[nuevoEstado]}.`);
      cargar(pagina, filtrosAplicados);
    } catch (e) {
      // El modal sigue abierto y muestra el motivo para que el usuario decida.
      setErrorEstado(interpretarErrorHttp(e, {
        409: "Esta transición de estado no está permitida para el convenio.",
        404: "El convenio no existe o fue eliminado.",
      }, "No se pudo cambiar el estado del convenio. Intenta de nuevo."));
    } finally {
      setCambiandoEstado(false);
    }
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Convenios</h1>
          <p className={styles.subtitulo}>Acuerdos comerciales con proveedores y clientes.</p>
        </div>
        {admin && (
          <Button onClick={abrirCrear}>Nuevo convenio</Button>
        )}
      </div>

      {/* Filtros */}
      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fEstado">Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger id="fEstado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {ESTADOS_CONVENIO.map((e) => (
                <SelectItem key={e} value={e}>
                  {ETIQUETAS_ESTADO[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.campoFiltro}>
          <Label htmlFor="fTipo">Tipo</Label>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger id="fTipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {TIPOS_CONVENIO.map((t) => (
                <SelectItem key={t} value={t}>
                  {ETIQUETAS_TIPO[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={`${styles.campoFiltro} ${styles.campoFiltroAncho}`}>
          <Label htmlFor="fNombre">Nombre</Label>
          <Input
            id="fNombre"
            value={fNombre}
            onChange={(e) => setFNombre(e.target.value)}
            placeholder="Buscar por nombre..."
          />
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

      {/* Tabla */}
      <div className={styles.tarjeta}>
        {cargando ? (
          <div className={styles.estado}>Cargando convenios...</div>
        ) : error ? (
          <div className={styles.estado} role="alert">{error}</div>
        ) : convenios.length === 0 ? (
          <div className={styles.estado}>No se encontraron convenios con los filtros aplicados.</div>
        ) : (
          <>
            <div className={styles.tablaScroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Proveedor</th>
                    <th>Bodega</th>
                    <th>Vigencia</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    {admin && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {convenios.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className={styles.codigo}>{c.codigo}</span>
                      </td>
                      <td>
                        <div className={styles.nombreConvenio} title={c.nombre}>
                          {c.nombre}
                        </div>
                        {c.responsable && (
                          <div className={styles.parteNombre} title={c.responsable}>
                            {c.responsable}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={styles.chipTipo}>{ETIQUETAS_TIPO[c.tipo] ?? c.tipo}</span>
                      </td>
                      <td>
                        {c.proveedorNombre ? (
                          <span className={styles.parteNombre} title={c.proveedorNombre}>
                            {c.proveedorNombre}
                          </span>
                        ) : (
                          <span className={styles.sinDato}>—</span>
                        )}
                      </td>
                      <td>
                        {c.bodegaNombre ? (
                          <span className={styles.parteNombre} title={c.bodegaNombre}>
                            {c.bodegaNombre}
                          </span>
                        ) : (
                          <span className={styles.sinDato}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.fecha}>{formatearFecha(c.fechaInicio)}</div>
                        {c.fechaFin && (
                          <div className={styles.fecha}>→ {formatearFecha(c.fechaFin)}</div>
                        )}
                      </td>
                      <td>
                        <span className={styles.valor}>{formatearValor(c.valorTotal)}</span>
                      </td>
                      <td>{chipEstado(c.estado)}</td>
                      {admin && (
                        <td>
                          <div className={styles.acciones}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirEditar(c)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirCambiarEstado(c)}
                            >
                              Estado
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.paginacion}>
              <span>
                {totalElementos} convenio{totalElementos !== 1 ? "s" : ""} · Página{" "}
                {pagina + 1} de {Math.max(totalPaginas, 1)}
              </span>
              <div className={styles.controlesPagina}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina <= 0 || cargando}
                  onClick={() => cargar(pagina - 1, filtrosAplicados)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina >= totalPaginas - 1 || cargando}
                  onClick={() => cargar(pagina + 1, filtrosAplicados)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal formulario */}
      <Dialog open={modalFormAbierto} onOpenChange={setModalFormAbierto}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {convenioEditando ? "Editar convenio" : "Nuevo convenio"}
            </DialogTitle>
            <DialogDescription>
              {convenioEditando
                ? "Modifica los datos del convenio y guarda los cambios."
                : "Completa los datos para registrar un nuevo convenio."}
            </DialogDescription>
          </DialogHeader>
          <ConvenioFormulario
            convenio={convenioEditando}
            alGuardar={alGuardar}
            alCerrar={() => setModalFormAbierto(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal cambio de estado */}
      <Dialog
        open={modalEstadoAbierto}
        onOpenChange={(abierto) => {
          if (!cambiandoEstado) setModalEstadoAbierto(abierto);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cambiar estado del convenio</DialogTitle>
            <DialogDescription>
              {convenioEstado
                ? `Convenio: ${convenioEstado.nombre} · Estado actual: ${ETIQUETAS_ESTADO[convenioEstado.estado]}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className={styles.modalCambioEstado}>
            {errorEstado && (
              <p className={styles.errorEstado} role="alert">
                {errorEstado}
              </p>
            )}
            <p>Selecciona el nuevo estado:</p>
            <div className={styles.opcionesEstado}>
              {ESTADOS_CONVENIO.filter((e) => e !== convenioEstado?.estado).map((e) => (
                <button
                  key={e}
                  type="button"
                  className={styles.botonEstado}
                  disabled={cambiandoEstado}
                  onClick={() => ejecutarCambioEstado(e)}
                >
                  {chipEstado(e)}
                  <span>{ETIQUETAS_ESTADO[e]}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
