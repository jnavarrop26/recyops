import { useState, useCallback } from "react";
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
import { ChipEstadoEntrega } from "./chip-estado-entrega";
import { listarEntregas, ESTADOS_ENTREGA, type Entrega } from "../servicios/entregasApi";
import { listarProveedores, type Proveedor } from "../servicios/proveedoresApi";
import { listarBodegas, type Bodega } from "../servicios/bodegasApi";
import styles from "./reportes-vista.module.css";

// ── Tipos de reporte disponibles ────────────────────────────
type TipoReporte = "entregas" | "proveedores" | "bodegas";

interface ConfigReporte {
  id: TipoReporte;
  emoji: string;
  color: string;
  nombre: string;
  desc: string;
}

const TIPOS: ConfigReporte[] = [
  { id: "entregas", emoji: "📦", color: "#e8f0fe", nombre: "Entregas", desc: "Historial de recepciones" },
  { id: "proveedores", emoji: "🏭", color: "#dcf2e3", nombre: "Proveedores", desc: "Directorio de proveedores" },
  { id: "bodegas", emoji: "🏗️", color: "#fdf0d5", nombre: "Bodegas", desc: "Capacidad y estado" },
];

const TODOS = "__todos__";

// ── Formatters ───────────────────────────────────────────────
const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtPeso = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const fmtMoneda = (v: number | null) =>
  v == null ? "—" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

// ── Export helpers ───────────────────────────────────────────
async function exportarPDF(
  titulo: string,
  cabeceras: string[],
  filas: (string | number)[][][],
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RecyOPS — " + titulo, 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, 23);

  autoTable(doc, {
    head: [cabeceras],
    body: filas.map((f) => f.map(String)),
    startY: 28,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 81, 50], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [231, 240, 235] },
  });

  doc.save(`recyops-${titulo.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
}

function exportarXLS(
  titulo: string,
  cabeceras: string[],
  filas: (string | number)[][],
) {
  import("xlsx").then((XLSX) => {
    const data = [cabeceras, ...filas];
    const hoja = XLSX.utils.aoa_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, titulo.slice(0, 31));
    XLSX.writeFile(libro, `recyops-${titulo.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.xlsx`);
  });
}

// ── Reporte Entregas ─────────────────────────────────────────
function ReporteEntregas() {
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
  const [fEstado, setFEstado] = useState(TODOS);
  const [datos, setDatos] = useState<Entrega[]>([]);
  const [cargando, setCargando] = useState(false);
  const [generado, setGenerado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await listarEntregas({
        estado: fEstado === TODOS ? undefined : fEstado,
        fechaDesde: desde || undefined,
        fechaHasta: hasta || undefined,
        size: 500,
      });
      setDatos(resp.content);
      setGenerado(true);
    } catch {
      setDatos([]);
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, fEstado]);

  const cabeceras = ["Código", "Proveedor", "Material", "Peso (kg)", "Bodega", "Estado", "Fecha recepción", "Registrado por"];
  const filas = datos.map((e) => [
    e.codigo, e.proveedorNombre, e.tipoMaterialNombre,
    fmtPeso.format(e.pesoKg), e.bodegaNombre, e.estado,
    fmtFecha(e.fechaRecepcion), e.usuarioRegistroNombre,
  ]);

  const totalKg = datos.reduce((s, e) => s + e.pesoKg, 0);

  return (
    <>
      <div className={styles.tarjetaConfig}>
        <p className={styles.tarjetaConfigTitulo}>Parámetros del reporte</p>
        <div className={styles.filaConfig}>
          <div className={styles.campoConfig}>
            <Label htmlFor="r-desde">Fecha desde</Label>
            <Input id="r-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className={styles.campoConfig}>
            <Label htmlFor="r-hasta">Fecha hasta</Label>
            <Input id="r-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className={styles.campoConfig}>
            <Label>Estado</Label>
            <Select value={fEstado} onValueChange={setFEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {ESTADOS_ENTREGA.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button type="button" className={styles.botonActualizar} onClick={cargar} disabled={cargando}>
            {cargando ? "Cargando..." : "Generar reporte"}
          </button>
        </div>
      </div>

      {generado && (
        <div className={styles.tarjetaConfig}>
          <div className={styles.exportar}>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <strong style={{ color: "var(--ink)" }}>{datos.length}</strong> entregas · <strong style={{ color: "var(--ink)" }}>{fmtPeso.format(totalKg)} kg</strong> en total
            </span>
            <div className={styles.separadorExport} />
            <button
              type="button"
              className={`${styles.botonExportar} ${styles.botonPdf}`}
              disabled={datos.length === 0}
              onClick={() => exportarPDF("Reporte de Entregas", cabeceras, filas.map((f) => f.map((v) => [v])))}
            >
              ↓ Exportar PDF
            </button>
            <button
              type="button"
              className={`${styles.botonExportar} ${styles.botonXls}`}
              disabled={datos.length === 0}
              onClick={() => exportarXLS("Entregas", cabeceras, filas)}
            >
              ↓ Exportar Excel
            </button>
          </div>
        </div>
      )}

      {generado && (
        <div className={styles.tarjetaTabla}>
          <div className={styles.tarjetaTablaHeader}>
            <span className={styles.tarjetaTablaTitulo}>Vista previa</span>
            <span className={styles.conteo}>{datos.length} registros</span>
          </div>
          {datos.length === 0 ? (
            <div className={styles.alertaVacia}>No hay entregas en el período seleccionado.</div>
          ) : (
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
                </tr>
              </thead>
              <tbody>
                {datos.slice(0, 50).map((e) => (
                  <tr key={e.id}>
                    <td className={styles.mono}>{e.codigo}</td>
                    <td>{e.proveedorNombre}</td>
                    <td>{e.tipoMaterialNombre}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{fmtPeso.format(e.pesoKg)}</td>
                    <td>{e.bodegaNombre}</td>
                    <td><ChipEstadoEntrega estado={e.estado} /></td>
                    <td className={styles.mono}>{fmtFecha(e.fechaRecepcion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {datos.length > 50 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", fontSize: 13, color: "var(--ink-muted)" }}>
              Mostrando 50 de {datos.length} filas. El archivo exportado incluye todos los registros.
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Reporte Proveedores ──────────────────────────────────────
function ReporteProveedores() {
  const [datos, setDatos] = useState<Proveedor[]>([]);
  const [fEstado, setFEstado] = useState(TODOS);
  const [cargando, setCargando] = useState(false);
  const [generado, setGenerado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await listarProveedores({ estado: fEstado === TODOS ? undefined : fEstado, size: 500 });
      setDatos(resp.content);
      setGenerado(true);
    } catch {
      setDatos([]);
    } finally {
      setCargando(false);
    }
  }, [fEstado]);

  const cabeceras = ["Nombre", "NIT", "Contacto", "Teléfono", "Email", "Calificación", "Estado", "Fecha registro"];
  const filas = datos.map((p) => [
    p.nombre, p.nit, p.contacto ?? "—", p.telefono ?? "—",
    p.email ?? "—", p.calificacion, p.estado, fmtFecha(p.fechaCreacion),
  ]);

  return (
    <>
      <div className={styles.tarjetaConfig}>
        <p className={styles.tarjetaConfigTitulo}>Parámetros del reporte</p>
        <div className={styles.filaConfig}>
          <div className={styles.campoConfig}>
            <Label>Estado</Label>
            <Select value={fEstado} onValueChange={setFEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {["ACTIVO", "INACTIVO", "BLOQUEADO"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button type="button" className={styles.botonActualizar} onClick={cargar} disabled={cargando}>
            {cargando ? "Cargando..." : "Generar reporte"}
          </button>
        </div>
      </div>

      {generado && (
        <div className={styles.tarjetaConfig}>
          <div className={styles.exportar}>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <strong style={{ color: "var(--ink)" }}>{datos.length}</strong> proveedores
            </span>
            <div className={styles.separadorExport} />
            <button type="button" className={`${styles.botonExportar} ${styles.botonPdf}`} disabled={datos.length === 0}
              onClick={() => exportarPDF("Reporte de Proveedores", cabeceras, filas.map((f) => f.map((v) => [v])))}>
              ↓ Exportar PDF
            </button>
            <button type="button" className={`${styles.botonExportar} ${styles.botonXls}`} disabled={datos.length === 0}
              onClick={() => exportarXLS("Proveedores", cabeceras, filas)}>
              ↓ Exportar Excel
            </button>
          </div>
        </div>
      )}

      {generado && (
        <div className={styles.tarjetaTabla}>
          <div className={styles.tarjetaTablaHeader}>
            <span className={styles.tarjetaTablaTitulo}>Vista previa</span>
            <span className={styles.conteo}>{datos.length} registros</span>
          </div>
          {datos.length === 0 ? (
            <div className={styles.alertaVacia}>No hay proveedores con los filtros seleccionados.</div>
          ) : (
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>NIT</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th className={styles.derecha}>Calificación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.slice(0, 50).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td className={styles.mono}>{p.nit}</td>
                    <td>{p.contacto ?? "—"}</td>
                    <td className={styles.mono}>{p.telefono ?? "—"}</td>
                    <td>{p.email ?? "—"}</td>
                    <td className={`${styles.mono} ${styles.derecha}`}>{"★".repeat(Math.round(p.calificacion))}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: p.estado === "ACTIVO" ? "#dcf2e3" : p.estado === "BLOQUEADO" ? "#fbe3e0" : "#f1efe9",
                        color: p.estado === "ACTIVO" ? "#166534" : p.estado === "BLOQUEADO" ? "#b42318" : "#6b6257",
                      }}>{p.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}

// ── Reporte Bodegas ──────────────────────────────────────────
function ReporteBodegas() {
  const [datos, setDatos] = useState<Bodega[]>([]);
  const [cargando, setCargando] = useState(false);
  const [generado, setGenerado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await listarBodegas({ size: 200 });
      setDatos(resp.content);
      setGenerado(true);
    } catch {
      setDatos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  const cabeceras = ["Nombre", "NIT", "Dirección", "Teléfono", "Tipo", "Estado"];
  const filas = datos.map((b) => [
    b.nombre, b.nit, b.direccion, b.telefono,
    b.tipoOrganizacion, b.estado,
  ]);

  return (
    <>
      <div className={styles.tarjetaConfig}>
        <p className={styles.tarjetaConfigTitulo}>Sin filtros adicionales</p>
        <div className={styles.filaConfig}>
          <button type="button" className={styles.botonActualizar} onClick={cargar} disabled={cargando}>
            {cargando ? "Cargando..." : "Generar reporte"}
          </button>
        </div>
      </div>

      {generado && (
        <div className={styles.tarjetaConfig}>
          <div className={styles.exportar}>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <strong style={{ color: "var(--ink)" }}>{datos.length}</strong> bodegas
            </span>
            <div className={styles.separadorExport} />
            <button type="button" className={`${styles.botonExportar} ${styles.botonPdf}`} disabled={datos.length === 0}
              onClick={() => exportarPDF("Reporte de Bodegas", cabeceras, filas.map((f) => f.map((v) => [v])))}>
              ↓ Exportar PDF
            </button>
            <button type="button" className={`${styles.botonExportar} ${styles.botonXls}`} disabled={datos.length === 0}
              onClick={() => exportarXLS("Bodegas", cabeceras, filas)}>
              ↓ Exportar Excel
            </button>
          </div>
        </div>
      )}

      {generado && (
        <div className={styles.tarjetaTabla}>
          <div className={styles.tarjetaTablaHeader}>
            <span className={styles.tarjetaTablaTitulo}>Vista previa</span>
            <span className={styles.conteo}>{datos.length} bodegas</span>
          </div>
          {datos.length === 0 ? (
            <div className={styles.alertaVacia}>No hay bodegas registradas.</div>
          ) : (
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.nombre}</td>
                    <td><span className={styles.mono} style={{ fontSize: 11 }}>{b.tipoOrganizacion}</span></td>
                    <td>{b.direccion}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: b.estado === "ACTIVA" ? "#dcf2e3" : b.estado === "MANTENIMIENTO" ? "#fdf0d5" : "#f1efe9",
                        color: b.estado === "ACTIVA" ? "#166534" : b.estado === "MANTENIMIENTO" ? "#92600a" : "#6b6257",
                      }}>{b.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}

// ── Vista principal ──────────────────────────────────────────
export function ReportesVista() {
  const [tipoActivo, setTipoActivo] = useState<TipoReporte>("entregas");

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <h1 className={styles.titulo}>Reportes</h1>
        <p className={styles.subtitulo}>Genera y exporta informes en PDF o Excel según el módulo y período.</p>
      </div>

      <div className={styles.layout}>
        {/* Selector de tipo */}
        <div className={styles.panelSelector}>
          <div className={styles.panelSelectorCabecera}>
            <p className={styles.panelSelectorTitulo}>Tipo de reporte</p>
          </div>
          <div className={styles.listaTipos}>
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.botonTipo} ${tipoActivo === t.id ? styles.botonTipoActivo : ""}`}
                onClick={() => setTipoActivo(t.id)}
              >
                <div className={styles.textoTipo}>
                  <span className={styles.nombreTipo}>{t.nombre}</span>
                  <span className={styles.descTipo}>{t.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del reporte seleccionado */}
        <div className={styles.panelContenido}>
          {tipoActivo === "entregas" && <ReporteEntregas />}
          {tipoActivo === "proveedores" && <ReporteProveedores />}
          {tipoActivo === "bodegas" && <ReporteBodegas />}
        </div>
      </div>
    </div>
  );
}
