import { useState, useEffect, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  listarConvenios,
  cambiarEstadoConvenio,
  ESTADOS_CONVENIO,
  TIPOS_CONVENIO,
  type Convenio,
  type EstadoConvenio,
} from "../servicios/conveniosApi";
import { ConvenioFormulario } from "./convenio-formulario";
import styles from "./convenios-vista.module.css";

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
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
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

  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [convenioEditando, setConvenioEditando] = useState<Convenio | null>(null);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [convenioEstado, setConvenioEstado] = useState<Convenio | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarConvenios({
          estado: valor(fEstado),
          tipo: valor(fTipo),
          nombre: fNombre.trim() || undefined,
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
    [fEstado, fTipo, fNombre],
  );

  useEffect(() => {
    cargar(0);
  }, []);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    cargar(0);
  }

  function limpiarFiltros() {
    setFEstado(TODOS);
    setFTipo(TODOS);
    setFNombre("");
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
    cargar(pagina);
  }

  function abrirCambiarEstado(c: Convenio) {
    setConvenioEstado(c);
    setModalEstadoAbierto(true);
  }

  async function ejecutarCambioEstado(nuevoEstado: EstadoConvenio) {
    if (!convenioEstado) return;
    setCambiandoEstado(true);
    try {
      await cambiarEstadoConvenio(convenioEstado.id, nuevoEstado);
      setModalEstadoAbierto(false);
      cargar(pagina);
    } catch {
      // sin acción — el modal permanece abierto
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
          <Label>Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger>
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
          <Label>Tipo</Label>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger>
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
          <Label>Nombre</Label>
          <Input
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
          <div className={styles.estado}>{error}</div>
        ) : convenios.length === 0 ? (
          <div className={styles.estado}>No se encontraron convenios con los filtros aplicados.</div>
        ) : (
          <>
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
                  onClick={() => cargar(pagina - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina >= totalPaginas - 1 || cargando}
                  onClick={() => cargar(pagina + 1)}
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
        <DialogContent className="max-w-2xl">
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
      <Dialog open={modalEstadoAbierto} onOpenChange={setModalEstadoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado del convenio</DialogTitle>
            <DialogDescription>
              {convenioEstado
                ? `Convenio: ${convenioEstado.nombre} · Estado actual: ${ETIQUETAS_ESTADO[convenioEstado.estado]}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className={styles.modalCambioEstado}>
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
