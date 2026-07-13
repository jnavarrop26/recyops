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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { BodegaFormulario } from "./bodega-formulario";
import { ChipEstado } from "./bodega-ui";
import {
  listarBodegas,
  cambiarEstadoBodega,
  ESTADOS_BODEGA,
  TIPOS_ORGANIZACION,
  type Bodega,
  type EstadoBodega,
} from "../servicios/bodegasApi";
import styles from "./bodegas-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
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

  const [modalAbierto, setModalAbierto] = useState(false);
  const [bodegaEditando, setBodegaEditando] = useState<Bodega | null>(null);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarBodegas({
          estado: valor(fEstado),
          tipoOrganizacion: valor(fTipo),
          nombre: fNombre.trim() || undefined,
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
    [fEstado, fTipo, fNombre],
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
    setFTipo(TODOS);
    setFNombre("");
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
    cargar(pagina);
  }

  async function cambiarEstado(bodega: Bodega, nuevoEstado: EstadoBodega) {
    try {
      const actualizada = await cambiarEstadoBodega(bodega.id, nuevoEstado);
      setBodegas((previas) =>
        previas.map((b) => (b.id === bodega.id ? { ...b, estado: actualizada.estado } : b)),
      );
    } catch (e: any) {
      const estado = e?.response?.status;
      if (estado === 403) setError("No tienes permisos para esta acción.");
      else if (estado === 404) setError("La bodega no existe o fue eliminada.");
      else setError("No se pudo cambiar el estado de la bodega.");
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
          <Label>Estado</Label>
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger>
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
          <Label>Tipo de organización</Label>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger>
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
          <div className={styles.estado}>{error}</div>
        ) : bodegas.length === 0 ? (
          <div className={styles.estado}>No se encontraron bodegas.</div>
        ) : (
          <>
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
                                onValueChange={(v) => cambiarEstado(bodega, v as EstadoBodega)}
                              >
                                <SelectTrigger>
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

            <div className={styles.paginacion}>
              <span>
                {totalElementos} bodegas · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
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

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
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
