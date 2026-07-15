import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
import { IndicadorStock, ChipStock } from "@/app/modules/inventario/indicador-stock";
import { AjusteModal } from "@/app/modules/inventario/ajuste-modal";
import { MermaModal } from "@/app/modules/inventario/merma-modal";
import { LineaConfigurarModal } from "@/app/modules/inventario/linea-configurar-modal";
import { listarInventario, type LineaInventario } from "@/app/modules/inventario/inventarioApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import styles from "@/app/modules/inventario/inventario-vista.module.css";

const TAMANO_PAGINA = 20;

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
}

const formatearFecha = (iso: string) => {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleString("es-CO");
};

export function InventarioVista() {
  const admin = esAdmin();
  const navegar = useNavigate();

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [bodegaId, setBodegaId] = useState("");

  const [lineas, setLineas] = useState<LineaInventario[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modales (ADMIN)
  const [lineaAjuste, setLineaAjuste] = useState<LineaInventario | null>(null);
  const [lineaMerma, setLineaMerma] = useState<LineaInventario | null>(null);
  const [modalConfigurar, setModalConfigurar] = useState(false);
  const [lineaConfigurar, setLineaConfigurar] = useState<LineaInventario | null>(null);

  // Carga inicial de bodegas y selección de la primera.
  useEffect(() => {
    (async () => {
      try {
        const bs = await listarBodegas({ size: 100 });
        setBodegas(bs.content);
        if (bs.content.length > 0) setBodegaId(bs.content[0].id);
      } catch {
        setError("No se pudieron cargar las bodegas.");
      }
    })();
  }, []);

  const cargar = useCallback(
    async (paginaSolicitada: number) => {
      if (!bodegaId) return;
      setCargando(true);
      setError(null);
      try {
        const datos = await listarInventario({
          bodegaId,
          bajoMinimo: soloBajoMinimo ? "true" : undefined,
          page: paginaSolicitada,
          size: TAMANO_PAGINA,
        });
        setLineas(datos.content);
        setTotalElementos(datos.totalElements);
        setTotalPaginas(datos.totalPages);
        setPagina(datos.number);
      } catch {
        setError("No se pudo cargar el inventario de la bodega.");
        setLineas([]);
      } finally {
        setCargando(false);
      }
    },
    [bodegaId, soloBajoMinimo],
  );

  useEffect(() => {
    cargar(0);
  }, [cargar]);

  const alertas = lineas.filter((l) => l.bajoMinimo || l.stockActual < l.stockMinimo);

  function abrirCrearLinea() {
    setLineaConfigurar(null);
    setModalConfigurar(true);
  }
  function abrirEditarTopes(linea: LineaInventario) {
    setLineaConfigurar(linea);
    setModalConfigurar(true);
  }
  function alGuardarConfig() {
    setModalConfigurar(false);
    cargar(pagina);
  }
  function alGuardarMovimiento(actualizada: LineaInventario) {
    setLineaAjuste(null);
    setLineaMerma(null);
    setLineas((prev) => prev.map((l) => (l.id === actualizada.id ? actualizada : l)));
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Inventario</h1>
          <p className={styles.subtitulo}>Stock de materiales por bodega.</p>
        </div>
        {admin && bodegaId && <Button onClick={abrirCrearLinea}>Dar de alta material</Button>}
      </div>

      <div className={styles.barraControles}>
        <div className={styles.campo}>
          <Label>Bodega</Label>
          <Select value={bodegaId} onValueChange={setBodegaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona bodega" />
            </SelectTrigger>
            <SelectContent>
              {bodegas.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.toggleMinimo}>
          <Switch id="bajoMinimo" checked={soloBajoMinimo} onCheckedChange={setSoloBajoMinimo} />
          <Label htmlFor="bajoMinimo">Solo bajo el mínimo</Label>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className={styles.alertas}>
          <p className={styles.alertasTitulo}>
            {alertas.length} material(es) bajo stock mínimo
          </p>
          <div className={styles.alertasLista}>
            {alertas.map((a) => (
              <span key={a.id} className={styles.alertaChip}>
                {a.tipoMaterialNombre}: {a.stockActual.toLocaleString("es-CO")} / mín{" "}
                {a.stockMinimo.toLocaleString("es-CO")}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.tarjeta}>
        {!bodegaId ? (
          <div className={styles.estado}>Selecciona una bodega para ver su inventario.</div>
        ) : cargando ? (
          <div className={styles.estado}>Cargando inventario...</div>
        ) : error ? (
          <div className={styles.estado}>{error}</div>
        ) : lineas.length === 0 ? (
          <div className={styles.estado}>No hay materiales registrados en esta bodega.</div>
        ) : (
          <>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Categoría</th>
                  <th className={styles.derecha}>Stock actual</th>
                  <th className={styles.derecha}>Mínimo</th>
                  <th className={styles.derecha}>Máximo</th>
                  <th>Estado</th>
                  <th>Actualización</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea) => {
                  const baja = linea.bajoMinimo || linea.stockActual < linea.stockMinimo;
                  return (
                    <tr key={linea.id} className={baja ? styles.filaBaja : undefined}>
                      <td>{linea.tipoMaterialNombre}</td>
                      <td>{linea.categoriaNombre}</td>
                      <td className={`${styles.mono} ${styles.derecha}`}>
                        {linea.stockActual.toLocaleString("es-CO")}
                      </td>
                      <td className={`${styles.mono} ${styles.derecha}`}>
                        {linea.stockMinimo.toLocaleString("es-CO")}
                      </td>
                      <td className={`${styles.mono} ${styles.derecha}`}>
                        {linea.stockMaximo.toLocaleString("es-CO")}
                      </td>
                      <td>
                        <IndicadorStock linea={linea} />
                        <div style={{ marginTop: 4 }}>
                          <ChipStock linea={linea} />
                        </div>
                      </td>
                      <td className={styles.mono}>{formatearFecha(linea.fechaActualizacion)}</td>
                      <td>
                        <div className={styles.acciones}>
                          <Button variant="outline" size="sm" onClick={() => navegar(`/inventario/${linea.id}`)}>
                            Historial
                          </Button>
                          {admin && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => setLineaAjuste(linea)}>
                                Ajuste
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setLineaMerma(linea)}>
                                Merma
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => abrirEditarTopes(linea)}>
                                Topes
                              </Button>
                            </>
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
                {totalElementos} líneas · Página {pagina + 1} de {Math.max(totalPaginas, 1)}
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

      {lineaAjuste && (
        <AjusteModal linea={lineaAjuste} alCerrar={() => setLineaAjuste(null)} alGuardar={alGuardarMovimiento} />
      )}
      {lineaMerma && (
        <MermaModal linea={lineaMerma} alCerrar={() => setLineaMerma(null)} alGuardar={alGuardarMovimiento} />
      )}
      {modalConfigurar && (
        <LineaConfigurarModal
          linea={lineaConfigurar}
          bodegaIdPorDefecto={bodegaId}
          alCerrar={() => setModalConfigurar(false)}
          alGuardar={alGuardarConfig}
        />
      )}
    </div>
  );
}
