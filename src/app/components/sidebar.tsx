import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { RecyOPSIcon } from "./recyops-icon";
import styles from "./sidebar.module.css";

interface SubOpcion {
  ruta: string;
  etiqueta: string;
}

interface OpcionMenu {
  ruta: string;
  etiqueta: string;
  etiquetaPrincipal?: string;
  subopciones?: SubOpcion[];
  soloAdmin?: boolean;
}

const opciones: OpcionMenu[] = [
  { ruta: "/inicio", etiqueta: "Inicio" },
  { ruta: "/mis-tareas", etiqueta: "Mis tareas" },
  { ruta: "/tareas", etiqueta: "Tareas", soloAdmin: true },
  {
    ruta: "/ingreso",
    etiqueta: "Ingreso",
    etiquetaPrincipal: "Registrar ingreso",
    subopciones: [{ ruta: "/ingreso/historial", etiqueta: "Historial de ingresos" }],
  },
  { ruta: "/trabajadores", etiqueta: "Trabajadores", soloAdmin: true },
  { ruta: "/materiales", etiqueta: "Materiales", soloAdmin: true },
  { ruta: "/proveedores", etiqueta: "Proveedores", soloAdmin: true },
  { ruta: "/inventario", etiqueta: "Inventario", soloAdmin: true },
  {
    ruta: "/entregas",
    etiqueta: "Entregas",
    etiquetaPrincipal: "Registrar entrega",
    soloAdmin: true,
    subopciones: [{ ruta: "/entregas/historial", etiqueta: "Historial de entregas" }],
  },
  { ruta: "/convenios", etiqueta: "Convenios", soloAdmin: true },
  { ruta: "/bodegas", etiqueta: "Bodegas", soloAdmin: true },
  { ruta: "/reportes", etiqueta: "Reportes", soloAdmin: true },
  { ruta: "/logs", etiqueta: "Logs", soloAdmin: true },
  { ruta: "/configuracion", etiqueta: "Configuración" },
  { ruta: "/servicios-externos", etiqueta: "Servicios externos", soloAdmin: true },
];

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
}

function GrupoConSubmenu({ opcion }: { opcion: OpcionMenu }) {
  const ubicacion = useLocation();
  const rutaActivaEnGrupo = ubicacion.pathname.startsWith(opcion.ruta);
  const [abierto, setAbierto] = useState(rutaActivaEnGrupo);

  return (
    <div className={styles.grupo}>
      <button
        type="button"
        className={styles.botonGrupo}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <span>{opcion.etiqueta}</span>
        <span className={`${styles.flecha} ${abierto ? styles.flechaAbierta : ""}`}>›</span>
      </button>

      {abierto && (
        <div className={styles.submenu}>
          <NavLink
            to={opcion.ruta}
            end
            className={({ isActive }) =>
              isActive ? `${styles.subLink} ${styles.subActivo}` : styles.subLink
            }
          >
            {opcion.etiquetaPrincipal ?? opcion.etiqueta}
          </NavLink>
          {opcion.subopciones?.map((sub) => (
            <NavLink
              key={sub.ruta}
              to={sub.ruta}
              className={({ isActive }) =>
                isActive ? `${styles.subLink} ${styles.subActivo}` : styles.subLink
              }
            >
              {sub.etiqueta}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const admin = esAdmin();
  const opcionesFiltradas = opciones.filter((o) => !o.soloAdmin || admin);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <RecyOPSIcon size={28} variant="light" />
          <div className={styles.brandName}>RecyOPS</div>
        </div>
        <div className={styles.brandTag}>Bodegas de Reciclaje</div>
      </div>

      <nav className={styles.nav}>
        {opcionesFiltradas.map((opcion) =>
          opcion.subopciones ? (
            <GrupoConSubmenu key={opcion.ruta} opcion={opcion} />
          ) : (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {opcion.etiqueta}
            </NavLink>
          ),
        )}
      </nav>

      <div className={styles.footer}>
        <RecyOPSIcon size={14} variant="light" />
        RecyOPS © 2023 — 2026
      </div>
    </aside>
  );
}
