import { useEffect, useState, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
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
import { MaterialFormulario } from "@/app/modules/materiales/material-formulario";
import {
  listarMateriales,
  obtenerCategorias,
  obtenerResinas,
  obtenerColores,
  cambiarEstadoMaterial,
  type Material,
  type OpcionCatalogo,
} from "@/app/modules/materiales/materialesApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import styles from "@/app/modules/materiales/materiales-vista.module.css";

const TAMANO_PAGINA = 20;
const TODOS = "__todos__";

// Solo el rol ADMIN puede crear/editar/activar-desactivar.
function esAdmin(): boolean {
  return (localStorage.getItem("recyops_rol") || "").toUpperCase() === "ADMIN";
}

const formatearPrecio = (valor: number) =>
  "$ " + valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface FiltrosMateriales {
  categoria: string;
  resina: string;
  color: string;
  empaque: string;
  activo: string;
}

const FILTROS_INICIALES: FiltrosMateriales = {
  categoria: TODOS,
  resina: TODOS,
  color: TODOS,
  empaque: TODOS,
  activo: TODOS,
};

export function MaterialesVista() {
  const admin = esAdmin();

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fCategoria, setFCategoria] = useState(TODOS);
  const [fResina, setFResina] = useState(TODOS);
  const [fColor, setFColor] = useState(TODOS);
  const [fEmpaque, setFEmpaque] = useState(TODOS);
  const [fActivo, setFActivo] = useState(TODOS);
  // Filtros con los que se cargó la lista: paginar y recargar usan estos,
  // no los que el usuario está editando sin aplicar.
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosMateriales>(FILTROS_INICIALES);

  // Catálogos para los filtros
  const [categorias, setCategorias] = useState<OpcionCatalogo[]>([]);
  const [resinas, setResinas] = useState<OpcionCatalogo[]>([]);
  const [colores, setColores] = useState<OpcionCatalogo[]>([]);

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);

  const valor = (v: string) => (v === TODOS ? undefined : v);

  const cargar = useCallback(
    async (paginaSolicitada: number, filtros: FiltrosMateriales) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarMateriales({
          categoria: valor(filtros.categoria),
          resina: valor(filtros.resina),
          color: valor(filtros.color),
          empaque: valor(filtros.empaque),
          activo: valor(filtros.activo),
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setMateriales(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el listado de materiales.");
        setMateriales([]);
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const [cats, res, cols] = await Promise.all([
          obtenerCategorias(),
          obtenerResinas(),
          obtenerColores(),
        ]);
        setCategorias(cats);
        setResinas(res);
        setColores(cols);
      } catch {
        /* los filtros simplemente quedarán vacíos */
      }
    })();
    cargar(0, FILTROS_INICIALES);
  }, [cargar]);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    const filtros = {
      categoria: fCategoria,
      resina: fResina,
      color: fColor,
      empaque: fEmpaque,
      activo: fActivo,
    };
    setFiltrosAplicados(filtros);
    cargar(0, filtros);
  }

  function limpiarFiltros() {
    setFCategoria(TODOS);
    setFResina(TODOS);
    setFColor(TODOS);
    setFEmpaque(TODOS);
    setFActivo(TODOS);
    setFiltrosAplicados(FILTROS_INICIALES);
    cargar(0, FILTROS_INICIALES);
  }

  function abrirCrear() {
    setMaterialEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(material: Material) {
    setMaterialEditando(material);
    setModalAbierto(true);
  }

  function alGuardar() {
    setModalAbierto(false);
    cargar(pagina, filtrosAplicados);
  }

  async function alternarEstado(material: Material) {
    try {
      await cambiarEstadoMaterial(material.id, !material.activo);
      setMateriales((previos) =>
        previos.map((m) => (m.id === material.id ? { ...m, activo: !m.activo } : m)),
      );
    } catch (e) {
      setError(interpretarErrorHttp(e, {
        404: "El material no existe o fue eliminado.",
      }, "No se pudo cambiar el estado del material."));
    }
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Materiales</h1>
          <p className={styles.subtitulo}>Catálogo de materiales reciclables.</p>
        </div>
        {admin && <Button onClick={abrirCrear}>Nuevo material</Button>}
      </div>

      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fCategoria">Categoría</Label>
          <Select value={fCategoria} onValueChange={setFCategoria}>
            <SelectTrigger id="fCategoria">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.codigo} value={c.codigo}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fResina">Resina</Label>
          <Select value={fResina} onValueChange={setFResina}>
            <SelectTrigger id="fResina">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas</SelectItem>
              {resinas.map((r) => (
                <SelectItem key={r.codigo} value={r.codigo}>
                  {r.codigo} · {r.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fColor">Color</Label>
          <Select value={fColor} onValueChange={setFColor}>
            <SelectTrigger id="fColor">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {colores.map((c) => (
                <SelectItem key={c.codigo} value={c.codigo}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fEmpaque">Empaque</Label>
          <Select value={fEmpaque} onValueChange={setFEmpaque}>
            <SelectTrigger id="fEmpaque">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              <SelectItem value="GRANEL">Granel</SelectItem>
              <SelectItem value="PACA">Paca</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campoFiltro}>
          <Label htmlFor="fActivo">Estado</Label>
          <Select value={fActivo} onValueChange={setFActivo}>
            <SelectTrigger id="fActivo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
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
          <div className={styles.estado}>Cargando materiales...</div>
        ) : error ? (
          <div className={styles.estado}>{error}</div>
        ) : materiales.length === 0 ? (
          <div className={styles.estado}>No se encontraron materiales.</div>
        ) : (
          <>
            <div className={styles.tablaScroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Resina</th>
                    <th>Color</th>
                    <th>Empaque</th>
                    <th className={styles.derecha}>Precio base</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.map((material) => (
                    <tr key={material.id}>
                      <td>{material.nombre}</td>
                      <td>{material.categoriaNombre}</td>
                      <td>{material.resinaNombre ?? "—"}</td>
                      <td>{material.colorNombre ?? "—"}</td>
                      <td>{material.unidadEmpaque}</td>
                      <td className={`${styles.mono} ${styles.derecha}`}>
                        {formatearPrecio(material.precioBase)}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            material.activo ? styles.badgeActivo : styles.badgeInactivo
                          }`}
                        >
                          {material.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        {admin ? (
                          <div className={styles.acciones}>
                            <Button variant="outline" size="sm" onClick={() => abrirEditar(material)}>
                              Editar
                            </Button>
                            <Switch
                              checked={material.activo}
                              onCheckedChange={() => alternarEstado(material)}
                              aria-label="Activar o desactivar material"
                            />
                          </div>
                        ) : (
                          <span className={styles.subtitulo}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.paginacion}>
              <span>
                {totalElementos} materiales · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
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

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{materialEditando ? "Editar material" : "Nuevo material"}</DialogTitle>
            <DialogDescription>
              Los campos con * son obligatorios. Resina y color solo aplican a la categoría Plástico.
            </DialogDescription>
          </DialogHeader>
          <MaterialFormulario
            material={materialEditando}
            alGuardar={alGuardar}
            alCerrar={() => setModalAbierto(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
