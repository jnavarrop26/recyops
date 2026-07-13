import { useNavigate, useLocation } from "react-router";
import { LogOut } from "lucide-react";
import { cerrarSesion } from "../servicios/authApi";
import { RecyOPSIcon } from "./recyops-icon";
import styles from "./topbar.module.css";

const RUTAS_ETIQUETAS: Record<string, string> = {
  ingreso: "Ingreso",
  trabajadores: "Trabajadores",
  materiales: "Materiales",
  proveedores: "Proveedores",
  inventario: "Inventario",
  entregas: "Entregas",
  convenios: "Convenios",
  logs: "Logs",
  bodegas: "Bodegas",
  configuracion: "Configuración",
  "servicios-externos": "Servicios externos",
};

function obtenerIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function obtenerEtiquetaRuta(pathname: string): string {
  const segmento = pathname.replace(/^\//, "").split("/")[0];
  return RUTAS_ETIQUETAS[segmento] ?? segmento;
}

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const nombre = localStorage.getItem("sicofar_nombre") ?? "Usuario";
  const rol = (localStorage.getItem("sicofar_rol") ?? "OPERARIO").toUpperCase();
  const iniciales = obtenerIniciales(nombre);
  const etiquetaPagina = obtenerEtiquetaRuta(location.pathname);

  function salir() {
    cerrarSesion();
    navigate("/");
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.breadcrumb}>
        <RecyOPSIcon size={20} variant="default" />
        <span>RecyOPS</span>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbActual}>{etiquetaPagina}</span>
      </div>

      <div className={styles.perfil}>
        <div className={styles.avatar} title={nombre}>
          {iniciales || "U"}
        </div>
        <div className={styles.perfilInfo}>
          <span className={styles.perfilNombre}>{nombre}</span>
          <span className={styles.perfilRol}>{rol}</span>
        </div>
        <span className={`${styles.chipRol} ${rol === "ADMIN" ? styles.chipRolAdmin : ""}`}>
          {rol}
        </span>

        <div className={styles.separador} />

        <button type="button" className={styles.botonCerrar} onClick={salir}>
          <LogOut size={14} />
          Salir
        </button>
      </div>
    </header>
  );
}
